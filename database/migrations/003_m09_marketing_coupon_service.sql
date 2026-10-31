-- =====================================================================
-- KAIDO E-COMMERCE — MIGRATION 003: M09 — CouponService nguyên tử
-- Chạy SAU database/schema.sql trong Supabase SQL Editor.
-- Script idempotent: có thể chạy lặp lại.
--
-- schema.sql đã tạo đủ bảng M09 (banners, article_categories, articles,
-- campaigns, campaign_items, coupons, coupon_usages) và trigger BR-M09-04
-- (tối đa 5 banner HOME_HERO đang bật). Migration này chỉ bổ sung 2 hàm
-- PL/pgSQL bắt buộc cho CouponService — database/README §4 quy định:
-- "Các thao tác nguyên tử khác (cộng/trừ điểm, đếm lượt dùng voucher) phải
--  được viết thành hàm PL/pgSQL, không xử lý bằng nhiều câu lệnh rời".
--
--   * public.m09_consume_coupon — tăng used_count nguyên tử khi tạo đơn (BR-M07-05)
--   * public.m09_release_coupon — hoàn lượt dùng khi hủy đơn hợp lệ (BR-M09-05)
--
-- Quy ước: hàm chạy SECURITY INVOKER, chỉ service role gọi qua server;
-- thông điệp RAISE EXCEPTION là tiếng Việt vì fromSupabaseError() chuyển
-- P0001 thẳng ra envelope lỗi cho người dùng.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. M09-F08 / BR-M07-05 — Tiêu thụ coupon khi đơn được tạo
--    * Khóa dòng coupon để tránh hai đơn vượt usage_limit cùng lúc.
--    * Idempotent theo (coupon_id, order_id): gọi lại trả already_used=true.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m09_consume_coupon(
  p_coupon_id uuid,
  p_order_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_discount_amount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_per_user_used integer := 0;
  v_used_count integer;
BEGIN
  IF p_coupon_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu coupon hoặc đơn hàng để ghi nhận lượt dùng.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE id = p_coupon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy mã giảm giá.' USING ERRCODE = 'P0001';
  END IF;

  -- Gọi lại cho cùng đơn: không trừ lượt lần thứ hai.
  IF EXISTS (
    SELECT 1 FROM public.coupon_usages
    WHERE coupon_id = p_coupon_id AND order_id = p_order_id
  ) THEN
    RETURN jsonb_build_object(
      'coupon_id', p_coupon_id,
      'order_id', p_order_id,
      'used_count', v_coupon.used_count,
      'already_used', true
    );
  END IF;

  IF NOT v_coupon.is_active OR v_coupon.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Mã giảm giá đã ngừng áp dụng.' USING ERRCODE = 'P0001';
  END IF;

  IF now() < v_coupon.valid_from OR now() > v_coupon.valid_to THEN
    RAISE EXCEPTION 'Mã giảm giá đã hết hạn hoặc chưa tới thời gian áp dụng.' USING ERRCODE = 'P0001';
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'Mã giảm giá đã hết lượt sử dụng.' USING ERRCODE = 'P0001';
  END IF;

  IF v_coupon.usage_limit_per_user IS NOT NULL AND p_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_per_user_used
    FROM public.coupon_usages
    WHERE coupon_id = p_coupon_id AND user_id = p_user_id;

    IF v_per_user_used >= v_coupon.usage_limit_per_user THEN
      RAISE EXCEPTION 'Bạn đã dùng mã giảm giá này đủ số lượt cho phép.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.coupon_usages (coupon_id, user_id, order_id, discount_amount)
  VALUES (p_coupon_id, p_user_id, p_order_id, GREATEST(COALESCE(p_discount_amount, 0), 0));

  UPDATE public.coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id
  RETURNING used_count INTO v_used_count;

  RETURN jsonb_build_object(
    'coupon_id', p_coupon_id,
    'order_id', p_order_id,
    'used_count', v_used_count,
    'already_used', false
  );
END;
$$;

COMMENT ON FUNCTION public.m09_consume_coupon(uuid, uuid, uuid, numeric)
  IS 'M09-F08/BR-M07-05 — ghi nhận lượt dùng coupon nguyên tử, idempotent theo (coupon_id, order_id).';

-- ---------------------------------------------------------------------
-- 2. M09-F08 / BR-M09-05 — Hoàn lượt dùng khi hủy đơn hợp lệ
--    * Chỉ giảm used_count nếu thực sự có bản ghi coupon_usages của đơn.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m09_release_coupon(
  p_coupon_id uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_used_count integer;
  v_deleted integer := 0;
BEGIN
  IF p_coupon_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu coupon hoặc đơn hàng để hoàn lượt dùng.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM 1 FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy mã giảm giá.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.coupon_usages
  WHERE coupon_id = p_coupon_id AND order_id = p_order_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    SELECT used_count INTO v_used_count FROM public.coupons WHERE id = p_coupon_id;
    RETURN jsonb_build_object(
      'coupon_id', p_coupon_id,
      'order_id', p_order_id,
      'released', false,
      'used_count', v_used_count
    );
  END IF;

  UPDATE public.coupons
  SET used_count = GREATEST(used_count - 1, 0),
      updated_at = now()
  WHERE id = p_coupon_id
  RETURNING used_count INTO v_used_count;

  RETURN jsonb_build_object(
    'coupon_id', p_coupon_id,
    'order_id', p_order_id,
    'released', true,
    'used_count', v_used_count
  );
END;
$$;

COMMENT ON FUNCTION public.m09_release_coupon(uuid, uuid)
  IS 'M09-F08/BR-M09-05 — hoàn lượt dùng coupon khi hủy đơn hợp lệ.';

-- =====================================================================
-- HẾT MIGRATION 003
-- =====================================================================
