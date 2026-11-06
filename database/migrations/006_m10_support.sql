-- =====================================================================
-- KAIDO E-COMMERCE — MIGRATION 006: M10 — Phản hồi cửa hàng & CSKH
-- Chạy SAU database/schema.sql (và các migration trước) trong Supabase SQL Editor.
-- Script idempotent: có thể chạy lặp lại.
--
-- schema.sql đã tạo đủ bảng M10 (reviews, review_media, faq_categories, faqs,
-- support_tickets, ticket_messages, ticket_attachments) cùng 2 trigger BR-M10-05.
-- Migration này bổ sung phần còn thiếu cho SRS M10:
--
--   * public.review_replies    — phản hồi công khai của cửa hàng (M10-F05).
--   * Trigger BR-M10-01        — chốt chặn cuối: review chỉ gắn order_item đã COMPLETED.
--   * Trigger BR-M10-04        — chuẩn hóa RESOLVED/CLOSED (resolved_at, closed_at).
--   * public.m10_close_resolved_tickets — cron tự đóng ticket quá 72 giờ (BR-M10-04).
--
-- Quy ước: trigger/hàm chạy SECURITY INVOKER, chỉ service role gọi qua server;
-- RAISE EXCEPTION dùng tiếng Việt vì fromSupabaseError() chuyển P0001 thẳng
-- ra envelope lỗi cho người dùng.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. M10-F05 — Phản hồi của cửa hàng cho một đánh giá (1 phản hồi/review)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  replier_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_replies_content_length_chk CHECK (char_length(content) BETWEEN 5 AND 1000)
);
COMMENT ON TABLE public.review_replies
  IS 'M10-F05 — phản hồi công khai của cửa hàng (nhãn KAIDO Store), tối đa 1 phản hồi mỗi đánh giá.';

CREATE INDEX IF NOT EXISTS review_replies_replied_at_idx
  ON public.review_replies (created_at DESC);

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. BR-M10-01 — Chốt chặn CSDL: đánh giá chỉ hợp lệ khi order_item thuộc
--    đúng sản phẩm/khách hàng và đơn đã COMPLETED.
--    (Service đã kiểm tra qua M05; trigger bảo vệ trước mọi đường ghi khác.)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_review_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_status text;
  v_order_user uuid;
  v_item_product uuid;
BEGIN
  SELECT o.status::text, o.user_id, oi.product_id
    INTO v_order_status, v_order_user, v_item_product
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.id = NEW.order_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng đơn hàng để xác thực đánh giá (BR-M10-01)'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order_status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'Chỉ được đánh giá sản phẩm từ đơn đã hoàn thành (BR-M10-01)'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_order_user IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Đơn hàng không thuộc khách đang đánh giá (BR-M10-01)'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_item_product IS DISTINCT FROM NEW.product_id THEN
    RAISE EXCEPTION 'Sản phẩm đánh giá không khớp dòng đơn hàng (BR-M10-01)'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_review_verified_purchase()
  IS 'BR-M10-01 — chặn đánh giá khi order_item không thuộc đơn COMPLETED của chính khách.';

DROP TRIGGER IF EXISTS trg_reviews_verified_purchase ON public.reviews;
CREATE TRIGGER trg_reviews_verified_purchase
  BEFORE INSERT OR UPDATE OF order_item_id, user_id, product_id ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_verified_purchase();

-- ---------------------------------------------------------------------
-- 3. BR-M10-04 — Mốc thời gian RESOLVED/CLOSED luôn khớp trạng thái
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_support_ticket_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'RESOLVED' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at := now();
  END IF;

  IF NEW.status = 'CLOSED' THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  END IF;

  IF NEW.status IN ('OPEN', 'IN_PROGRESS') THEN
    NEW.resolved_at := NULL;
    NEW.closed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_support_ticket_timestamps()
  IS 'BR-M10-04 — đồng bộ resolved_at/closed_at theo status ticket.';

DROP TRIGGER IF EXISTS trg_support_tickets_timestamps ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_timestamps
  BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.sync_support_ticket_timestamps();

-- ---------------------------------------------------------------------
-- 4. BR-M10-04 — Cron: đóng ticket RESOLVED quá N giờ không có phản hồi mới
--    * Chỉ đóng khi kể từ resolved_at không có tin nhắn CUSTOMER nào.
--    * Idempotent: gọi lặp lại chỉ đóng thêm ticket đủ điều kiện.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m10_close_resolved_tickets(p_hours integer DEFAULT 72)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit timestamptz := now() - make_interval(hours => GREATEST(COALESCE(p_hours, 72), 1));
  v_ticket_id uuid;
  v_closed integer := 0;
BEGIN
  FOR v_ticket_id IN
    SELECT t.id
    FROM public.support_tickets t
    WHERE t.status = 'RESOLVED'
      AND t.resolved_at IS NOT NULL
      AND t.resolved_at <= v_limit
      AND NOT EXISTS (
        SELECT 1
        FROM public.ticket_messages m
        WHERE m.ticket_id = t.id
          AND m.sender_type = 'CUSTOMER'
          AND m.created_at > t.resolved_at
      )
    ORDER BY t.resolved_at
  LOOP
    UPDATE public.support_tickets
    SET status = 'CLOSED',
        closed_at = COALESCE(closed_at, now()),
        updated_at = now()
    WHERE id = v_ticket_id
      AND status = 'RESOLVED';

    IF FOUND THEN
      INSERT INTO public.ticket_messages (ticket_id, sender_type, sender_id, content)
      VALUES (
        v_ticket_id,
        'SYSTEM',
        NULL,
        'Hệ thống tự động đóng yêu cầu sau 72 giờ kể từ khi được giải quyết (BR-M10-04).'
      );
      v_closed := v_closed + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'closed_count', v_closed,
    'threshold_hours', GREATEST(COALESCE(p_hours, 72), 1),
    'ran_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.m10_close_resolved_tickets(integer)
  IS 'BR-M10-04 — tự đóng ticket RESOLVED quá 72 giờ không có phản hồi của khách.';

-- =====================================================================
-- HẾT MIGRATION 006
-- =====================================================================
