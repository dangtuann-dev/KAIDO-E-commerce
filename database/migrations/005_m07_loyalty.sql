-- =====================================================================
-- KAIDO E-COMMERCE — MIGRATION 005: M07 — Điểm thưởng nguyên tử
-- Chạy SAU schema.sql, seed.sql và các migration trước trong Supabase SQL Editor.
-- Script idempotent: có thể chạy lặp lại.
--
-- database/README §4 quy định: cộng/trừ/hoàn điểm và cấp voucher phải là hàm
-- PL/pgSQL, không xử lý bằng nhiều câu lệnh rời qua supabase-js.
--
--   * public.m07_award_points     — cộng điểm khi đơn COMPLETED (M07-F03)
--   * public.m07_redeem_points    — trừ điểm khi tạo đơn (M07-F04)
--   * public.m07_refund_points    — hoàn điểm khi hủy đơn (M07-F04)
--   * public.m07_expire_points    — quét điểm hết hạn (M07-F07)
--   * public.m07_evaluate_tier    — xét hạng theo chi tiêu 12 tháng (M07-F05)
--   * public.m07_assign_voucher   — cấp voucher sinh nhật/hạng (M07-F06)
--
-- Quy ước: SECURITY INVOKER, chỉ service role gọi qua server. Thông điệp
-- RAISE EXCEPTION là tiếng Việt vì fromSupabaseError() chuyển P0001 thẳng
-- ra envelope lỗi cho người dùng.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. M07-F05 / BR-M07-04 — Xét hạng theo chi tiêu 12 tháng gần nhất
--    Đồng thời cập nhật lifetime_spend và rolling_spend_12m trên tài khoản.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_evaluate_tier(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lifetime numeric := 0;
  v_rolling numeric := 0;
  v_tier public.membership_tiers%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng để xét hạng thành viên.' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_lifetime
  FROM public.orders
  WHERE user_id = p_user_id AND status = 'COMPLETED';

  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_rolling
  FROM public.orders
  WHERE user_id = p_user_id
    AND status = 'COMPLETED'
    AND COALESCE(completed_at, updated_at) >= now() - interval '12 months';

  SELECT * INTO v_tier
  FROM public.membership_tiers
  WHERE v_rolling >= min_spend
    AND (max_spend IS NULL OR v_rolling < max_spend)
  ORDER BY sort_order DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_tier FROM public.membership_tiers ORDER BY sort_order ASC LIMIT 1;
  END IF;

  INSERT INTO public.loyalty_accounts (
    user_id, tier_code, total_points, available_points, lifetime_spend, rolling_spend_12m, tier_updated_at
  )
  VALUES (p_user_id, v_tier.code, 0, 0, v_lifetime, v_rolling, now())
  ON CONFLICT (user_id) DO UPDATE
    SET tier_code = EXCLUDED.tier_code,
        lifetime_spend = EXCLUDED.lifetime_spend,
        rolling_spend_12m = EXCLUDED.rolling_spend_12m,
        tier_updated_at = now(),
        updated_at = now();

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'tier_code', v_tier.code,
    'tier_name', v_tier.name,
    'point_multiplier', v_tier.point_multiplier,
    'lifetime_spend', v_lifetime,
    'rolling_spend_12m', v_rolling
  );
END;
$$;

COMMENT ON FUNCTION public.m07_evaluate_tier(uuid)
  IS 'M07-F05/BR-M07-04 — xét hạng theo rolling spend 12 tháng và cập nhật loyalty_accounts.';

-- ---------------------------------------------------------------------
-- 2. M07-F03 / BR-M07-01 — Cộng điểm khi đơn COMPLETED (idempotent theo đơn)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_award_points(
  p_user_id uuid,
  p_order_id uuid,
  p_points integer,
  p_expires_at timestamptz DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng hoặc đơn hàng để cộng điểm.' USING ERRCODE = 'P0001';
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Số điểm cộng phải lớn hơn 0.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loyalty_point_transactions
    WHERE order_id = p_order_id AND transaction_type = 'EARN'
  ) THEN
    SELECT available_points INTO v_balance
    FROM public.loyalty_accounts WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'awarded', false,
      'already_awarded', true,
      'points', 0,
      'balance_after', COALESCE(v_balance, 0)
    );
  END IF;

  INSERT INTO public.loyalty_accounts AS a (user_id, tier_code, total_points, available_points)
  VALUES (p_user_id, 'BRONZE', p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = a.total_points + p_points,
        available_points = a.available_points + p_points,
        updated_at = now()
  RETURNING available_points INTO v_balance;

  INSERT INTO public.loyalty_point_transactions (
    user_id, order_id, transaction_type, points, balance_after, expires_at, description
  )
  VALUES (
    p_user_id, p_order_id, 'EARN', p_points, v_balance, p_expires_at,
    COALESCE(p_description, 'Tích điểm đơn hàng hoàn tất')
  );

  RETURN jsonb_build_object(
    'awarded', true,
    'already_awarded', false,
    'points', p_points,
    'balance_after', v_balance
  );
END;
$$;

COMMENT ON FUNCTION public.m07_award_points(uuid, uuid, integer, timestamptz, text)
  IS 'M07-F03/BR-M07-01 — cộng điểm nguyên tử, idempotent theo (order_id, EARN).';

-- ---------------------------------------------------------------------
-- 3. M07-F04 / BR-M07-02, BR-M07-03 — Trừ điểm khi đặt đơn
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_redeem_points(
  p_user_id uuid,
  p_order_id uuid,
  p_points integer,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng hoặc đơn hàng để trừ điểm.' USING ERRCODE = 'P0001';
  END IF;
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Số điểm tiêu phải lớn hơn 0.' USING ERRCODE = 'P0001';
  END IF;
  IF p_points % 10 <> 0 THEN
    RAISE EXCEPTION 'Điểm tiêu phải là bội số của 10.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loyalty_point_transactions
    WHERE order_id = p_order_id AND transaction_type = 'REDEEM'
  ) THEN
    SELECT available_points INTO v_balance
    FROM public.loyalty_accounts WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'redeemed', false,
      'already_redeemed', true,
      'points', 0,
      'balance_after', COALESCE(v_balance, 0)
    );
  END IF;

  INSERT INTO public.loyalty_accounts (user_id, tier_code, total_points, available_points)
  VALUES (p_user_id, 'BRONZE', 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.loyalty_accounts
  SET available_points = available_points - p_points,
      updated_at = now()
  WHERE user_id = p_user_id AND available_points >= p_points
  RETURNING available_points INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bạn không đủ điểm khả dụng để thực hiện giao dịch này.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.loyalty_point_transactions (
    user_id, order_id, transaction_type, points, balance_after, description
  )
  VALUES (
    p_user_id, p_order_id, 'REDEEM', -p_points, v_balance,
    COALESCE(p_description, 'Sử dụng điểm cho đơn hàng')
  );

  RETURN jsonb_build_object(
    'redeemed', true,
    'already_redeemed', false,
    'points', p_points,
    'balance_after', v_balance
  );
END;
$$;

COMMENT ON FUNCTION public.m07_redeem_points(uuid, uuid, integer, text)
  IS 'M07-F04/BR-M07-02 — trừ điểm khả dụng nguyên tử, idempotent theo (order_id, REDEEM).';

-- ---------------------------------------------------------------------
-- 4. M07-F04 — Hoàn 100% điểm khi đơn bị hủy (idempotent theo đơn)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_refund_points(
  p_user_id uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_points integer;
  v_balance integer;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng hoặc đơn hàng để hoàn điểm.' USING ERRCODE = 'P0001';
  END IF;

  SELECT -points INTO v_points
  FROM public.loyalty_point_transactions
  WHERE user_id = p_user_id AND order_id = p_order_id AND transaction_type = 'REDEEM'
  ORDER BY created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('refunded', false, 'points', 0, 'balance_after', NULL);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loyalty_point_transactions
    WHERE order_id = p_order_id AND transaction_type = 'REFUND'
  ) THEN
    SELECT available_points INTO v_balance
    FROM public.loyalty_accounts WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'refunded', false,
      'already_refunded', true,
      'points', 0,
      'balance_after', COALESCE(v_balance, 0)
    );
  END IF;

  UPDATE public.loyalty_accounts
  SET available_points = available_points + v_points,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING available_points INTO v_balance;

  INSERT INTO public.loyalty_point_transactions (
    user_id, order_id, transaction_type, points, balance_after, description
  )
  VALUES (
    p_user_id, p_order_id, 'REFUND', v_points, v_balance,
    'Hoàn điểm do hủy đơn hàng'
  );

  RETURN jsonb_build_object(
    'refunded', true,
    'already_refunded', false,
    'points', v_points,
    'balance_after', v_balance
  );
END;
$$;

COMMENT ON FUNCTION public.m07_refund_points(uuid, uuid)
  IS 'M07-F04 — hoàn 100% điểm đã tiêu khi đơn hủy, idempotent theo (order_id, REFUND).';

-- ---------------------------------------------------------------------
-- 5. M07-F07 — Quét điểm hết hạn
--    expired còn lại = tổng EARN đã quá expires_at − tổng EXPIRE đã ghi.
--    Chỉ trừ tối đa số điểm khả dụng hiện có; idempotent khi chạy lặp.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_expire_points(p_now timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account RECORD;
  v_earned integer;
  v_expired integer;
  v_remaining integer;
  v_deduct integer;
  v_balance integer;
  v_total integer := 0;
  v_users integer := 0;
BEGIN
  FOR v_account IN
    SELECT user_id, available_points FROM public.loyalty_accounts ORDER BY user_id
  LOOP
    SELECT COALESCE(SUM(points), 0) INTO v_earned
    FROM public.loyalty_point_transactions
    WHERE user_id = v_account.user_id
      AND transaction_type = 'EARN'
      AND expires_at IS NOT NULL
      AND expires_at <= p_now;

    SELECT COALESCE(-SUM(points), 0) INTO v_expired
    FROM public.loyalty_point_transactions
    WHERE user_id = v_account.user_id AND transaction_type = 'EXPIRE';

    v_remaining := v_earned - v_expired;

    IF v_remaining > 0 AND v_account.available_points > 0 THEN
      v_deduct := LEAST(v_remaining, v_account.available_points);

      UPDATE public.loyalty_accounts
      SET available_points = available_points - v_deduct,
          updated_at = now()
      WHERE user_id = v_account.user_id
      RETURNING available_points INTO v_balance;

      INSERT INTO public.loyalty_point_transactions (
        user_id, transaction_type, points, balance_after, description
      )
      VALUES (
        v_account.user_id, 'EXPIRE', -v_deduct, v_balance,
        'Điểm hết hạn theo chính sách 365 ngày'
      );

      v_total := v_total + v_deduct;
      v_users := v_users + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'expired_points', v_total,
    'affected_users', v_users,
    'ran_at', p_now
  );
END;
$$;

COMMENT ON FUNCTION public.m07_expire_points(timestamptz)
  IS 'M07-F07 — quét điểm hết hạn, ghi ledger EXPIRE, idempotent khi chạy lặp.';

-- ---------------------------------------------------------------------
-- 6. M07-F06 — Cấp voucher sinh nhật/hạng cho khách (idempotent theo năm)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m07_assign_voucher(
  p_user_id uuid,
  p_coupon_id uuid,
  p_source text DEFAULT 'BIRTHDAY',
  p_expires_at timestamptz DEFAULT NULL,
  p_once_per_year boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_coupon_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng hoặc voucher để cấp.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_coupon_id::text || ':' || COALESCE(p_source, ''), 0)
  );

  IF p_once_per_year THEN
    SELECT id INTO v_id
    FROM public.customer_vouchers
    WHERE user_id = p_user_id
      AND coupon_id = p_coupon_id
      AND COALESCE(source, '') = COALESCE(p_source, '')
      AND assigned_at >= date_trunc('year', now())
    ORDER BY assigned_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('voucher_id', v_id, 'already_assigned', true);
    END IF;
  END IF;

  INSERT INTO public.customer_vouchers (user_id, coupon_id, status, source, expires_at)
  VALUES (p_user_id, p_coupon_id, 'AVAILABLE', p_source, p_expires_at)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('voucher_id', v_id, 'already_assigned', false);
END;
$$;

COMMENT ON FUNCTION public.m07_assign_voucher(uuid, uuid, text, timestamptz, boolean)
  IS 'M07-F06 — cấp voucher cho khách, chống trùng theo năm khi p_once_per_year = true.';

-- =====================================================================
-- HẾT MIGRATION 005
-- =====================================================================
