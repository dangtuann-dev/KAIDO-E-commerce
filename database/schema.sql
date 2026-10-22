-- =====================================================================
-- KAIDO E-COMMERCE — DATABASE SCHEMA (PostgreSQL / Supabase)
-- Nguồn chân lý: KAIDO SRS v2.0 (IEEE 830) + Blueprint v1.0
-- Chạy trong Supabase SQL Editor. Script có thể chạy lặp lại.
--
-- Quy ước chung:
--   * Khóa chính UUID (trừ bảng log dùng BIGSERIAL).
--   * Xóa mềm bằng deleted_at ở các bảng danh mục/nội dung.
--   * RLS bật trên mọi bảng, KHÔNG tạo policy => mặc định từ chối.
--     Backend dùng service role key (bỏ qua RLS); anon/authenticated bị chặn.
--   * Mọi thao tác tồn kho nguyên tử nằm trong hàm PL/pgSQL ở cuối file.
--   * Thay đổi schema sau này đi qua database/migrations/.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() là STABLE nên không dùng trực tiếp được trong expression index.
-- Wrapper IMMUTABLE phục vụ tìm kiếm không dấu (M03-F01).
-- Schema của extension được resolve tại thời điểm tạo hàm để không phụ thuộc search_path
-- (Supabase có thể đặt extension trong schema "extensions" thay vì "public").
DO $do$
DECLARE
  unaccent_schema text;
BEGIN
  SELECT n.nspname INTO unaccent_schema
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'unaccent';

  IF unaccent_schema IS NULL THEN
    RAISE EXCEPTION 'Extension unaccent chưa được bật — xem database/README.md'
      USING ERRCODE = 'P0001';
  END IF;

  EXECUTE format(
    'CREATE OR REPLACE FUNCTION public.immutable_unaccent(input text) '
    'RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT '
    'AS $fn$ SELECT %I.unaccent(%L::regdictionary, input) $fn$',
    unaccent_schema,
    unaccent_schema || '.unaccent'
  );
END
$do$;

-- =====================================================================
-- ENUMS (khớp src/shared/constants)
-- =====================================================================
DO $$
DECLARE
  enum_name text;
  enum_labels text[];
BEGIN
  FOR enum_name, enum_labels IN
    SELECT v.name, v.labels
    FROM (VALUES
      ('role_type', ARRAY['CUSTOMER', 'STAFF', 'WAREHOUSE_KEEPER', 'MARKETING', 'ADMIN']),
      ('account_status', ARRAY['ACTIVE', 'LOCKED', 'DISABLED']),
      ('auth_provider', ARRAY['LOCAL', 'GOOGLE', 'FACEBOOK']),
      ('user_gender', ARRAY['MALE', 'FEMALE', 'OTHER']),
      ('product_status', ARRAY['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']),
      ('age_group', ARRAY['0-12M', '1-3Y', '3-6Y', '6-12Y', '12Y_PLUS']),
      ('gender_target', ARRAY['BOY', 'GIRL', 'UNISEX']),
      ('cart_status', ARRAY['ACTIVE', 'MERGED', 'CONVERTED', 'ABANDONED']),
      ('order_status', ARRAY[
        'PENDING_PAYMENT', 'PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'PACKING',
        'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'CANCELLED_TIMEOUT',
        'DELIVERY_FAILED', 'RETURNING', 'RETURNED'
      ]),
      ('payment_status', ARRAY['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED']),
      ('payment_method', ARRAY['COD', 'VNPAY', 'MOMO', 'ZALOPAY']),
      ('shipping_method', ARRAY['STANDARD', 'EXPRESS']),
      ('carrier_code', ARRAY['GHN', 'GHTK', 'VIETTELPOST']),
      ('shipment_status', ARRAY[
        'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
        'DELIVERED', 'FAILED', 'RETURNING', 'RETURNED'
      ]),
      ('order_change_source', ARRAY['CUSTOMER', 'STAFF', 'SYSTEM', 'CARRIER']),
      ('reservation_status', ARRAY['ACTIVE', 'RELEASED', 'FULFILLED', 'EXPIRED']),
      ('document_status', ARRAY['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED']),
      ('movement_type', ARRAY[
        'IMPORT', 'EXPORT', 'RESERVE', 'RELEASE', 'FULFILL',
        'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN'
      ]),
      ('discount_type', ARRAY['FIXED', 'PERCENT', 'FREESHIP']),
      ('coupon_scope', ARRAY['ALL', 'CATEGORY', 'PRODUCT', 'SHIPPING']),
      ('membership_tier', ARRAY['BRONZE', 'SILVER', 'GOLD', 'DIAMOND']),
      ('loyalty_transaction_type', ARRAY['EARN', 'REDEEM', 'REFUND', 'EXPIRE', 'ADJUST']),
      ('customer_voucher_status', ARRAY['AVAILABLE', 'USED', 'EXPIRED']),
      ('banner_position', ARRAY['HOME_HERO', 'HOME_PROMO', 'CATEGORY', 'SIDEBAR']),
      ('content_status', ARRAY['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']),
      ('article_status', ARRAY['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED']),
      ('campaign_type', ARRAY['FLASH_SALE', 'EVENT', 'SEASONAL']),
      ('campaign_status', ARRAY['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED']),
      ('shipping_region_type', ARRAY['INNER_CITY', 'PROVINCE']),
      ('review_status', ARRAY['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']),
      ('media_type', ARRAY['IMAGE', 'VIDEO']),
      ('return_reason', ARRAY['DAMAGED_IN_TRANSIT', 'DEFECTIVE', 'WRONG_ITEM', 'OTHER']),
      ('return_status', ARRAY[
        'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CANCELLED'
      ]),
      ('ticket_status', ARRAY['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
      ('ticket_category', ARRAY[
        'ORDER_ISSUE', 'WARRANTY_RETURN', 'PRODUCT_INQUIRY', 'PAYMENT', 'OTHER'
      ]),
      ('ticket_priority', ARRAY['LOW', 'NORMAL', 'HIGH', 'URGENT']),
      ('ticket_sender_type', ARRAY['CUSTOMER', 'STAFF', 'SYSTEM']),
      ('notification_channel', ARRAY['EMAIL', 'SMS', 'IN_APP']),
      ('notification_status', ARRAY['PENDING', 'SENT', 'FAILED'])
    ) AS v(name, labels)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = enum_name AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TYPE public.%I AS ENUM (%s)',
        enum_name,
        (SELECT string_agg(quote_literal(label_value), ', ') FROM unnest(enum_labels) AS l(label_value))
      );
    END IF;
  END LOOP;
END
$$;

-- =====================================================================
-- HÀM DÙNG CHUNG
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Bảng % là bất biến: không cho phép % (SYS-NFR-07).', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'P0001';
END;
$$;

-- Mã đơn dạng KD-YYMMDD-XXXXXX, sinh trước khi bảng orders tồn tại (PL/pgSQL biên dịch lazy).
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := 'KD-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

-- =====================================================================
-- ===== HỆ THỐNG: system_settings, audit_logs, notifications =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.system_settings IS 'Cấu hình nghiệp vụ runtime — seed từ src/shared/constants/business-rules.js';

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  actor_role role_type,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.audit_logs IS 'Nhật ký kiểm toán bất biến (SYS-NFR-07). Không FK tới users để giữ log sau khi xóa tài khoản.';

-- =====================================================================
-- ===== TOY-M01: Tài khoản & người dùng =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  password_hash text,
  full_name text NOT NULL,
  avatar_url text,
  child_birthdate date,
  gender user_gender,
  role role_type NOT NULL DEFAULT 'CUSTOMER',
  status account_status NOT NULL DEFAULT 'ACTIVE',
  auth_provider auth_provider NOT NULL DEFAULT 'LOCAL',
  google_id text,
  facebook_id text,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_lowercase_chk CHECK (email = lower(email)),
  CONSTRAINT users_phone_vn_chk CHECK (
    phone IS NULL OR phone ~ '^(03|05|07|08|09)[0-9]{8}$'
  ),
  CONSTRAINT users_full_name_length_chk CHECK (char_length(full_name) BETWEEN 2 AND 50)
);
COMMENT ON TABLE public.users IS 'M01-F01..F07. Email/SĐT duy nhất (BR-M01-01); mật khẩu băm Bcrypt (BR-M01-03).';
COMMENT ON COLUMN public.users.child_birthdate IS 'Thông tin bé để nhận voucher sinh nhật (M01-F03, M07/M09) — OPEN_DECISIONS.';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON public.users (lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON public.users (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique
  ON public.users (google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_facebook_id_unique
  ON public.users (facebook_id) WHERE facebook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_role_status_idx ON public.users (role, status);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL DEFAULT 'EMAIL',
  template_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status notification_status NOT NULL DEFAULT 'PENDING',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notifications IS 'Hàng đợi email/SMS/thông báo — worker gửi nằm ngoài phạm vi nền tảng.';

CREATE INDEX IF NOT EXISTS notifications_status_idx
  ON public.notifications (status, scheduled_at) WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  province_code text NOT NULL,
  province_name text NOT NULL,
  district_code text,
  district_name text,
  ward_code text NOT NULL,
  ward_name text NOT NULL,
  street_address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT addresses_recipient_name_chk CHECK (char_length(recipient_name) BETWEEN 2 AND 50),
  CONSTRAINT addresses_phone_vn_chk CHECK (phone ~ '^(03|05|07|08|09)[0-9]{8}$'),
  CONSTRAINT addresses_street_length_chk CHECK (char_length(street_address) BETWEEN 5 AND 255)
);
COMMENT ON TABLE public.addresses IS 'M01-F04. Tối đa 10 địa chỉ, đúng 1 mặc định (trigger + index bên dưới).';

CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_per_user
  ON public.addresses (user_id) WHERE is_default AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS addresses_user_idx
  ON public.addresses (user_id) WHERE deleted_at IS NULL;

-- M01-F04: giới hạn số địa chỉ và cập nhật địa chỉ mặc định trong một transaction.
CREATE OR REPLACE FUNCTION public.manage_user_address(
  p_action text,
  p_user_id uuid,
  p_address_id uuid DEFAULT NULL,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_address public.addresses%ROWTYPE;
  v_count integer;
  v_is_default boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  IF p_action = 'create' THEN
    SELECT count(*) INTO v_count
    FROM public.addresses
    WHERE user_id = p_user_id AND deleted_at IS NULL;

    IF v_count >= 10 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Mỗi tài khoản tối đa 10 địa chỉ.';
    END IF;

    v_is_default := v_count = 0 OR coalesce((p_data->>'is_default')::boolean, false);
    IF v_is_default THEN
      UPDATE public.addresses
      SET is_default = false, updated_at = now()
      WHERE user_id = p_user_id AND is_default AND deleted_at IS NULL;
    END IF;

    INSERT INTO public.addresses (
      user_id, recipient_name, phone, province_code, province_name,
      district_code, district_name, ward_code, ward_name, street_address, is_default
    ) VALUES (
      p_user_id, p_data->>'recipient_name', p_data->>'phone',
      p_data->>'province_code', p_data->>'province_name',
      p_data->>'district_code', p_data->>'district_name',
      p_data->>'ward_code', p_data->>'ward_name',
      p_data->>'street_address', v_is_default
    )
    RETURNING * INTO v_address;

    RETURN to_jsonb(v_address);
  ELSIF p_action = 'update' THEN
    SELECT * INTO v_address
    FROM public.addresses
    WHERE id = p_address_id AND user_id = p_user_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Không tìm thấy địa chỉ.';
    END IF;

    v_is_default := coalesce((p_data->>'is_default')::boolean, false);
    IF v_is_default THEN
      UPDATE public.addresses
      SET is_default = false, updated_at = now()
      WHERE user_id = p_user_id AND id <> p_address_id AND is_default AND deleted_at IS NULL;
    END IF;

    UPDATE public.addresses
    SET recipient_name = p_data->>'recipient_name',
        phone = p_data->>'phone',
        province_code = p_data->>'province_code',
        province_name = p_data->>'province_name',
        district_code = p_data->>'district_code',
        district_name = p_data->>'district_name',
        ward_code = p_data->>'ward_code',
        ward_name = p_data->>'ward_name',
        street_address = p_data->>'street_address',
        is_default = v_is_default,
        updated_at = now()
    WHERE id = p_address_id AND user_id = p_user_id
    RETURNING * INTO v_address;

    RETURN to_jsonb(v_address);
  ELSIF p_action = 'delete' THEN
    SELECT * INTO v_address
    FROM public.addresses
    WHERE id = p_address_id AND user_id = p_user_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Không tìm thấy địa chỉ.';
    END IF;

    IF v_address.is_default AND EXISTS (
      SELECT 1 FROM public.addresses
      WHERE user_id = p_user_id AND id <> p_address_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001',
        MESSAGE = 'Hãy chọn địa chỉ mặc định khác trước khi xóa địa chỉ này.';
    END IF;

    UPDATE public.addresses
    SET deleted_at = coalesce((p_data->>'deleted_at')::timestamptz, now()),
        is_default = false,
        updated_at = now()
    WHERE id = p_address_id AND user_id = p_user_id
    RETURNING * INTO v_address;

    RETURN to_jsonb(v_address);
  ELSIF p_action = 'set_default' THEN
    PERFORM 1 FROM public.addresses
    WHERE id = p_address_id AND user_id = p_user_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Không tìm thấy địa chỉ.';
    END IF;

    UPDATE public.addresses
    SET is_default = false, updated_at = now()
    WHERE user_id = p_user_id AND id <> p_address_id AND is_default AND deleted_at IS NULL;

    UPDATE public.addresses
    SET is_default = true, updated_at = now()
    WHERE id = p_address_id AND user_id = p_user_id
    RETURNING * INTO v_address;

    RETURN to_jsonb(v_address);
  END IF;

  RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Thao tác địa chỉ không hợp lệ.';
END;
$$;

REVOKE ALL ON FUNCTION public.manage_user_address(text, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_user_address(text, uuid, uuid, jsonb) TO service_role;

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_id uuid REFERENCES public.refresh_tokens(id) ON DELETE SET NULL,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refresh_tokens_expiry_chk CHECK (expires_at > created_at)
);
COMMENT ON TABLE public.refresh_tokens IS 'M01-F02. Refresh token 7 ngày lưu HttpOnly cookie; DB chỉ lưu hash.';

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON public.refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.password_reset_otps IS 'M01-F05. OTP hiệu lực 5 phút, tối đa 3 lần gửi/giờ (kiểm tra tại module).';

CREATE INDEX IF NOT EXISTS password_reset_otps_user_idx
  ON public.password_reset_otps (user_id, created_at DESC);

-- =====================================================================
-- ===== TOY-M02: Sản phẩm & danh mục =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon_url text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT categories_no_self_parent_chk CHECK (parent_id IS NULL OR parent_id <> id)
);
COMMENT ON TABLE public.categories IS 'M02-F01/F02. Cây 2-3 cấp; không xóa danh mục đang chứa sản phẩm (BR-M02-02).';

CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS categories_active_idx ON public.categories (is_active) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
COMMENT ON TABLE public.brands IS 'M02-F03. Thương hiệu đồ chơi (Lego, Bandai, Fisher-Price...).';

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  status product_status NOT NULL DEFAULT 'DRAFT',
  age_group age_group NOT NULL,
  gender_target gender_target NOT NULL DEFAULT 'UNISEX',
  material text,
  origin_country text,
  safety_info text,
  price_regular numeric(14, 0) NOT NULL CHECK (price_regular > 0),
  price_sale numeric(14, 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  rating_avg numeric(2, 1) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT products_name_length_chk CHECK (char_length(name) BETWEEN 5 AND 200),
  CONSTRAINT products_price_sale_chk CHECK (
    price_sale IS NULL OR (price_sale >= 0 AND price_sale <= price_regular)
  )
);
COMMENT ON TABLE public.products IS 'M02-F04..F08. BR-M02-03: giá sale không lớn hơn giá niêm yết. SKU nằm ở product_variants.';

CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS products_age_group_idx ON public.products (age_group);
CREATE INDEX IF NOT EXISTS products_gender_idx ON public.products (gender_target);
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products (price_regular);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS products_sold_count_idx ON public.products (sold_count DESC);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON public.products USING gin (public.immutable_unaccent(lower(name)) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);
COMMENT ON TABLE public.product_categories IS 'Quan hệ nhiều-nhiều sản phẩm - danh mục; một danh mục chính mỗi sản phẩm.';

CREATE UNIQUE INDEX IF NOT EXISTS product_categories_one_primary
  ON public.product_categories (product_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS product_categories_category_idx
  ON public.product_categories (category_id);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Mặc định',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT product_variants_sku_format_chk CHECK (sku ~ '^[A-Z0-9-]{3,30}$')
);
COMMENT ON TABLE public.product_variants IS 'M02-F04. SKU duy nhất toàn hệ thống (BR-M02-01); sản phẩm không biến thể có 1 variant Mặc định.';

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_one_default_per_product
  ON public.product_variants (product_id) WHERE is_default AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants (product_id);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_thumbnail boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.product_images IS 'M02-F07. Tối đa 10 ảnh/sản phẩm, 1 ảnh đại diện (trigger bên dưới).';

CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_thumbnail
  ON public.product_images (product_id) WHERE is_thumbnail;
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images (product_id);

-- =====================================================================
-- ===== TOY-M03: Tìm kiếm =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  guest_session_id text,
  keyword text NOT NULL,
  normalized_keyword text NOT NULL,
  result_count integer NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT search_history_actor_chk CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)
);
COMMENT ON TABLE public.search_history IS 'M03-F01/F05. Dữ liệu gợi ý autocomplete và từ khóa phổ biến; M03 chỉ đọc catalog M02 (SRS M03 §9).';

CREATE INDEX IF NOT EXISTS search_history_keyword_trgm_idx
  ON public.search_history USING gin (public.immutable_unaccent(lower(normalized_keyword)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS search_history_user_idx ON public.search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS search_history_created_idx ON public.search_history (created_at DESC);

-- =====================================================================
-- ===== TOY-M04: Giỏ hàng =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  guest_session_id text,
  status cart_status NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_owner_chk CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL)
);
COMMENT ON TABLE public.carts IS 'M04. Giỏ khách vãng lai giữ 30 ngày (BR-M04-04), gộp giỏ khi đăng nhập (M04-F05).';

CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_user
  ON public.carts (user_id) WHERE status = 'ACTIVE' AND user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_guest
  ON public.carts (guest_session_id) WHERE status = 'ACTIVE' AND guest_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS carts_expires_idx ON public.carts (expires_at) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price numeric(14, 0) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_unique_variant UNIQUE (cart_id, variant_id)
);
COMMENT ON TABLE public.cart_items IS 'M04. BR-M04-05: tối đa 20 sản phẩm/lần đặt; tồn khả dụng kiểm tra tại M08.';

CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON public.cart_items (cart_id);

CREATE TABLE IF NOT EXISTS public.cart_saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_saved_items_unique_variant UNIQUE (cart_id, variant_id)
);
COMMENT ON TABLE public.cart_saved_items IS 'M04 — danh sách "Để dành mua sau".';

-- =====================================================================
-- ===== TOY-M05: Đặt hàng & thanh toán =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE DEFAULT public.generate_order_code(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method payment_method NOT NULL,
  shipping_method shipping_method NOT NULL DEFAULT 'STANDARD',
  carrier_code carrier_code,
  currency char(3) NOT NULL DEFAULT 'VND',
  subtotal numeric(14, 0) NOT NULL CHECK (subtotal >= 0),
  discount_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  points_discount_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (points_discount_amount >= 0),
  shipping_fee numeric(14, 0) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total_amount numeric(14, 0) NOT NULL CHECK (total_amount >= 0),
  coupon_id uuid,
  coupon_code text,
  freeship_coupon_id uuid,
  freeship_coupon_code text,
  points_used integer NOT NULL DEFAULT 0 CHECK (points_used >= 0),
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  recipient_email text,
  shipping_province text NOT NULL,
  shipping_district text,
  shipping_ward text NOT NULL,
  shipping_address text NOT NULL,
  note text,
  cancel_reason text,
  payment_expires_at timestamptz,
  placed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_currency_chk CHECK (currency = 'VND'),
  CONSTRAINT orders_totals_chk CHECK (
    total_amount = subtotal + shipping_fee - discount_amount - points_discount_amount
    AND discount_amount + points_discount_amount <= subtotal + shipping_fee
  ),
  CONSTRAINT orders_coupon_code_chk CHECK (
    coupon_code IS NULL OR coupon_code ~ '^[A-Z0-9]{4,20}$'
  ),
  CONSTRAINT orders_freeship_code_chk CHECK (
    freeship_coupon_code IS NULL OR freeship_coupon_code ~ '^[A-Z0-9]{4,20}$'
  )
);
COMMENT ON TABLE public.orders IS 'M05-F06. Snapshot người nhận/giá theo BR-M05-05; user_id NULL cho đơn hỗ trợ. Trạng thái dùng enum thống nhất M05+M06.';
COMMENT ON COLUMN public.orders.payment_expires_at IS 'Hạn thanh toán online 20 phút (BR-M05-02); pg_cron tự hủy đơn quá hạn.';

CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_expires_idx
  ON public.orders (payment_expires_at) WHERE status = 'PENDING_PAYMENT';

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  sku text NOT NULL,
  product_name text NOT NULL,
  variant_name text,
  image_url text,
  unit_price numeric(14, 0) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  line_total numeric(14, 0) NOT NULL CHECK (line_total >= 0),
  product_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_line_total_chk CHECK (line_total = unit_price * quantity)
);
COMMENT ON TABLE public.order_items IS 'M05 — snapshot tên/SKU/giá tại thời điểm đặt (BR-M05-05), không đổi khi catalog thay đổi.';

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items (product_id);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider payment_method NOT NULL,
  transaction_ref text,
  provider_transaction_id text,
  amount numeric(14, 0) NOT NULL CHECK (amount > 0),
  status payment_status NOT NULL DEFAULT 'PENDING',
  idempotency_key text UNIQUE,
  request_payload jsonb,
  response_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payment_transactions IS 'M05-F04/F07 — log giao dịch độc lập, chống trùng bằng idempotency_key. Không lưu thông tin thẻ (PCI-DSS, SYS-NFR-04).';

CREATE INDEX IF NOT EXISTS payment_transactions_order_idx ON public.payment_transactions (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_provider_txn_unique
  ON public.payment_transactions (provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by uuid,
  changed_by_role role_type,
  change_source order_change_source NOT NULL DEFAULT 'SYSTEM',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.order_status_history IS 'Lịch sử trạng thái đơn — bất biến (NFR-M06-03).';

CREATE INDEX IF NOT EXISTS order_status_history_order_idx
  ON public.order_status_history (order_id, created_at DESC);

-- =====================================================================
-- ===== TOY-M06: Đơn hàng & giao vận =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_code carrier_code NOT NULL,
  tracking_code text,
  shipping_method shipping_method NOT NULL DEFAULT 'STANDARD',
  shipping_fee numeric(14, 0) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  status shipment_status NOT NULL DEFAULT 'PENDING',
  expected_delivery_date date,
  delivered_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count BETWEEN 0 AND 3),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.shipments IS 'M06-F02. BR-M06-03: tối đa 3 lần giao thất bại.';

CREATE INDEX IF NOT EXISTS shipments_order_idx ON public.shipments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_unique
  ON public.shipments (tracking_code) WHERE tracking_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id bigserial PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status shipment_status NOT NULL,
  description text,
  location text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.shipment_events IS 'M06-F03 — log webhook ĐVVC (GHN/GHTK/Viettel Post).';

CREATE INDEX IF NOT EXISTS shipment_events_shipment_idx
  ON public.shipment_events (shipment_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.shipping_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region_type shipping_region_type NOT NULL,
  province_code text,
  shipping_method shipping_method NOT NULL DEFAULT 'STANDARD',
  base_fee numeric(14, 0) NOT NULL CHECK (base_fee >= 0),
  free_shipping_threshold numeric(14, 0) NOT NULL DEFAULT 500000
    CHECK (free_shipping_threshold >= 0),
  effective_from date NOT NULL DEFAULT current_date,
  effective_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_fee_rules_window_chk
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);
COMMENT ON TABLE public.shipping_fee_rules IS 'M06-F08 + hằng số §2.7: nội thành 25k, tỉnh 35–50k, miễn phí từ 500k.';

CREATE INDEX IF NOT EXISTS shipping_fee_rules_active_idx
  ON public.shipping_fee_rules (is_active, region_type);

CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_code text NOT NULL UNIQUE
    DEFAULT ('RMA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status return_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  reason return_reason NOT NULL,
  description text,
  evidence_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  admin_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.return_requests IS 'M06-F12..F14 / RMA. Chính sách 7 ngày kể từ khi nhận (BR-M06-05) kiểm tra tại module.';

CREATE INDEX IF NOT EXISTS return_requests_order_idx ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS return_requests_status_idx ON public.return_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.return_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  condition_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT return_request_items_unique UNIQUE (return_request_id, order_item_id)
);
COMMENT ON TABLE public.return_request_items IS 'Chi tiết sản phẩm hoàn trả — không cho một order_item nằm 2 lần trong cùng yêu cầu.';

-- =====================================================================
-- ===== TOY-M07: Khuyến mãi & khách thân thiết =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  discount_type discount_type NOT NULL,
  discount_value numeric(14, 0) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  max_discount_amount numeric(14, 0) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  min_order_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  scope coupon_scope NOT NULL DEFAULT 'ALL',
  applicable_targets jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_limit_per_user integer CHECK (usage_limit_per_user IS NULL OR usage_limit_per_user > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT coupons_code_chk CHECK (code ~ '^[A-Z0-9]{4,20}$'),
  CONSTRAINT coupons_percent_chk CHECK (
    discount_type <> 'PERCENT' OR discount_value BETWEEN 1 AND 100
  ),
  CONSTRAINT coupons_window_chk CHECK (valid_to > valid_from),
  CONSTRAINT coupons_used_limit_chk CHECK (usage_limit IS NULL OR used_count <= usage_limit)
);
COMMENT ON TABLE public.coupons IS 'M07-F01..F04 + M09. Một CouponService duy nhất đặt tại M09, dùng chung M04/M05/M07. Mỗi đơn tối đa 1 voucher hàng + 1 voucher freeship.';

CREATE INDEX IF NOT EXISTS coupons_active_window_idx
  ON public.coupons (valid_to) WHERE is_active AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  used_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupon_usages_unique_per_order UNIQUE (coupon_id, order_id)
);
COMMENT ON TABLE public.coupon_usages IS 'M07 — đếm lượt dùng voucher; tăng used_count phải nằm trong hàm nguyên tử.';

CREATE INDEX IF NOT EXISTS coupon_usages_user_idx ON public.coupon_usages (user_id);
CREATE INDEX IF NOT EXISTS coupon_usages_order_idx ON public.coupon_usages (order_id);

CREATE TABLE IF NOT EXISTS public.membership_tiers (
  code membership_tier PRIMARY KEY,
  name text NOT NULL,
  min_spend numeric(14, 0) NOT NULL CHECK (min_spend >= 0),
  max_spend numeric(14, 0),
  point_multiplier numeric(3, 1) NOT NULL CHECK (point_multiplier > 0),
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_tiers_spend_chk CHECK (max_spend IS NULL OR max_spend > min_spend)
);
COMMENT ON TABLE public.membership_tiers IS 'M07-F05 / BR-M07-04 — Bronze 0–2tr, Silver 2–5tr x1.2, Gold 5–15tr x1.5, Diamond >15tr x2.0.';

CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  tier_code membership_tier NOT NULL DEFAULT 'BRONZE'
    REFERENCES public.membership_tiers(code) ON DELETE RESTRICT,
  total_points integer NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  available_points integer NOT NULL DEFAULT 0 CHECK (available_points >= 0),
  lifetime_spend numeric(14, 0) NOT NULL DEFAULT 0 CHECK (lifetime_spend >= 0),
  rolling_spend_12m numeric(14, 0) NOT NULL DEFAULT 0 CHECK (rolling_spend_12m >= 0),
  tier_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_accounts_points_chk CHECK (available_points <= total_points)
);
COMMENT ON TABLE public.loyalty_accounts IS 'M07-F03/F05 — điểm khả dụng, hạng thành viên xét theo 12 tháng gần nhất.';

CREATE TABLE IF NOT EXISTS public.loyalty_point_transactions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_type loyalty_transaction_type NOT NULL,
  points integer NOT NULL CHECK (points <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  expires_at timestamptz,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.loyalty_point_transactions IS 'M07-F03/F04/F07 — points có dấu (EARN dương, REDEEM/EXPIRE âm); bội số 10 khi tiêu, tối đa 50% hóa đơn (validation module).';

CREATE INDEX IF NOT EXISTS loyalty_point_transactions_user_idx
  ON public.loyalty_point_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS loyalty_point_transactions_expiry_idx
  ON public.loyalty_point_transactions (expires_at)
  WHERE transaction_type = 'EARN' AND expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.customer_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  status customer_voucher_status NOT NULL DEFAULT 'AVAILABLE',
  source text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_vouchers IS 'Voucher gán riêng cho khách (sinh nhật, hạng thành viên) — M07/M09.';

CREATE INDEX IF NOT EXISTS customer_vouchers_user_idx
  ON public.customer_vouchers (user_id, status);

-- =====================================================================
-- ===== TOY-M08: Kho & tồn kho =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.warehouses IS 'M08-F01. Một kho mặc định duy nhất — dùng khi API giữ tồn không truyền warehouse_id.';

CREATE UNIQUE INDEX IF NOT EXISTS warehouses_one_default ON public.warehouses (is_default)
  WHERE is_default;

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  tax_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.suppliers IS 'M08-F02 — nhà cung cấp phục vụ phiếu nhập kho.';

CREATE TABLE IF NOT EXISTS public.inventory_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  on_hand integer NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  available integer GENERATED ALWAYS AS (on_hand - reserved) STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_stocks_unique UNIQUE (variant_id, warehouse_id),
  CONSTRAINT inventory_stocks_reserved_chk CHECK (reserved <= on_hand)
);
COMMENT ON TABLE public.inventory_stocks IS 'M08-F04. Available = On-hand − Reserved (NFR-M08-01); mọi thay đổi qua hàm reserve/release/fulfill.';

CREATE INDEX IF NOT EXISTS inventory_stocks_variant_idx ON public.inventory_stocks (variant_id);
CREATE INDEX IF NOT EXISTS inventory_stocks_warehouse_idx ON public.inventory_stocks (warehouse_id);

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  status reservation_status NOT NULL DEFAULT 'ACTIVE',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_reservations IS 'M08-F05. Giữ chỗ 20 phút (BR-M05-02); pg_cron nhả tồn quá hạn mỗi phút.';

CREATE UNIQUE INDEX IF NOT EXISTS stock_reservations_one_active
  ON public.stock_reservations (order_ref, variant_id, warehouse_id)
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS stock_reservations_order_idx ON public.stock_reservations (order_ref);
CREATE INDEX IF NOT EXISTS stock_reservations_expiry_idx
  ON public.stock_reservations (expires_at) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status document_status NOT NULL DEFAULT 'DRAFT',
  note text,
  total_amount numeric(14, 0) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.goods_receipts IS 'M08-F06 — phiếu nhập kho.';

CREATE INDEX IF NOT EXISTS goods_receipts_warehouse_idx ON public.goods_receipts (warehouse_id);
CREATE INDEX IF NOT EXISTS goods_receipts_status_idx ON public.goods_receipts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14, 0) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.goods_receipt_items IS 'M08-F06 — dòng hàng nhập kho.';

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  status document_status NOT NULL DEFAULT 'DRAFT',
  requires_admin_approval boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_adjustments IS 'M08-F09 — kiểm kê; lệch > 5.000.000đ hoặc > 10 sản phẩm cần Admin duyệt.';

CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id uuid NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  system_quantity integer NOT NULL CHECK (system_quantity >= 0),
  counted_quantity integer NOT NULL CHECK (counted_quantity >= 0),
  difference integer GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_adjustment_items IS 'M08-F09 — số hệ thống, số kiểm thực tế và độ lệch.';

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  from_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status document_status NOT NULL DEFAULT 'DRAFT',
  note text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_transfers_diff_warehouse_chk CHECK (from_warehouse_id <> to_warehouse_id)
);
COMMENT ON TABLE public.stock_transfers IS 'M08-F07 — chuyển kho nội bộ.';

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_transfer_items IS 'M08-F07 — dòng hàng chuyển kho.';

CREATE TABLE IF NOT EXISTS public.stock_movement_logs (
  id bigserial PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  movement_type movement_type NOT NULL,
  quantity integer NOT NULL,
  on_hand_after integer NOT NULL CHECK (on_hand_after >= 0),
  reserved_after integer NOT NULL CHECK (reserved_after >= 0),
  reference_type text,
  reference_id text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_movement_logs_reserved_chk CHECK (reserved_after <= on_hand_after)
);
COMMENT ON TABLE public.stock_movement_logs IS 'Thẻ kho bất biến (NFR-M08-03). quantity có dấu: IMPORT +, EXPORT -, RESERVE +Reserved, RELEASE -Reserved, FULFILL -OnHand.';

CREATE INDEX IF NOT EXISTS stock_movement_logs_variant_idx
  ON public.stock_movement_logs (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movement_logs_reference_idx
  ON public.stock_movement_logs (reference_type, reference_id);

-- =====================================================================
-- ===== TOY-M09: Nội dung & quảng bá =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  mobile_image_url text,
  link_url text,
  position banner_position NOT NULL DEFAULT 'HOME_HERO',
  sort_order integer NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'DRAFT',
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT banners_window_chk CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);
COMMENT ON TABLE public.banners IS 'M09-F01/F02. Tối đa 5 banner HOME_HERO đang bật (BR-M09-04, trigger bên dưới).';

CREATE INDEX IF NOT EXISTS banners_position_active_idx
  ON public.banners (position, sort_order) WHERE is_active AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.article_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.article_categories IS 'M09 — danh mục cẩm nang đồ chơi.';

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image_url text,
  category_id uuid REFERENCES public.article_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status article_status NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
COMMENT ON TABLE public.articles IS 'M09-F03 — bài viết/cẩm nang; xuất bản theo lịch (M09-F05).';

CREATE INDEX IF NOT EXISTS articles_status_published_idx
  ON public.articles (status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (category_id);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  campaign_type campaign_type NOT NULL DEFAULT 'FLASH_SALE',
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status campaign_status NOT NULL DEFAULT 'DRAFT',
  banner_id uuid REFERENCES public.banners(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_window_chk CHECK (ends_at > starts_at)
);
COMMENT ON TABLE public.campaigns IS 'M09-F04/F05 — Flash Sale, sự kiện; cron kích hoạt theo lịch.';

CREATE INDEX IF NOT EXISTS campaigns_status_window_idx
  ON public.campaigns (status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS public.campaign_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  sale_price numeric(14, 0) NOT NULL CHECK (sale_price > 0),
  quantity_limit integer CHECK (quantity_limit IS NULL OR quantity_limit > 0),
  sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_items_sold_limit_chk
    CHECK (quantity_limit IS NULL OR sold_count <= quantity_limit)
);
COMMENT ON TABLE public.campaign_items IS 'M09-F04 — giá flash sale theo sản phẩm/biến thể.';

CREATE UNIQUE INDEX IF NOT EXISTS campaign_items_unique_product
  ON public.campaign_items (
    campaign_id,
    product_id,
    (COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  );

-- =====================================================================
-- ===== TOY-M10: Đánh giá & hỗ trợ =====
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  content text NOT NULL,
  status review_status NOT NULL DEFAULT 'PENDING',
  is_verified boolean NOT NULL DEFAULT true,
  helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  admin_note text,
  moderated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_content_length_chk CHECK (char_length(content) BETWEEN 10 AND 1000)
);
COMMENT ON TABLE public.reviews IS 'M10-F01/F02 — Verified Reviews: bắt buộc gắn order_item đã mua; duyệt trước khi hiển thị.';

CREATE INDEX IF NOT EXISTS reviews_product_approved_idx
  ON public.reviews (product_id, created_at DESC) WHERE status = 'APPROVED';
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  url text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes BETWEEN 0 AND 5242880),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.review_media IS 'M10 — tối đa 5 ảnh hoặc 1 video, mỗi tệp ≤ 5MB (BR-M10-05, trigger bên dưới).';

CREATE INDEX IF NOT EXISTS review_media_review_idx ON public.review_media (review_id);

CREATE TABLE IF NOT EXISTS public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.faq_categories IS 'M10-F07 — 4 nhóm FAQ: Giao hàng, Đổi trả, Thanh toán, Bảo hành và Kỹ thuật.';

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
COMMENT ON TABLE public.faqs IS 'M10-F07 — nội dung FAQ, hỗ trợ JSON-LD FAQPage (SYS-NFR-02).';

CREATE INDEX IF NOT EXISTS faqs_category_idx ON public.faqs (category_id, sort_order);

CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text NOT NULL UNIQUE
    DEFAULT ('#TK-' || lpad(nextval('public.support_ticket_seq')::text, 5, '0')),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  subject text NOT NULL,
  category ticket_category NOT NULL DEFAULT 'OTHER',
  priority ticket_priority NOT NULL DEFAULT 'NORMAL',
  status ticket_status NOT NULL DEFAULT 'OPEN',
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.support_tickets IS 'M10-F06 — ticket #TK-XXXXX; tự đóng sau 72 giờ RESOLVED (BR-M10-04, cron).';

CREATE INDEX IF NOT EXISTS support_tickets_user_idx
  ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type ticket_sender_type NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ticket_messages IS 'M10-F06 — hội thoại ticket; sender SYSTEM cho thông báo tự động.';

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx
  ON public.ticket_messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  media_type media_type NOT NULL,
  file_url text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes BETWEEN 0 AND 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ticket_attachments IS 'M10 — tối đa 5 ảnh hoặc 1 video mỗi tin nhắn, tệp ≤ 5MB (BR-M10-05).';

CREATE INDEX IF NOT EXISTS ticket_attachments_message_idx
  ON public.ticket_attachments (message_id);

-- =====================================================================
-- KHÓA NGOẠI HOÃN (orders tham chiếu coupons tạo sau)
-- =====================================================================
DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_coupon_id_fkey
    FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_freeship_coupon_id_fkey
    FOREIGN KEY (freeship_coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- TRIGGER CẬP NHẬT updated_at
-- =====================================================================
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'system_settings', 'users', 'addresses', 'categories', 'brands', 'products',
    'product_variants', 'carts', 'cart_items', 'orders', 'payment_transactions',
    'shipments', 'shipping_fee_rules', 'return_requests', 'coupons',
    'membership_tiers', 'loyalty_accounts', 'customer_vouchers', 'warehouses',
    'suppliers', 'inventory_stocks', 'stock_reservations', 'goods_receipts',
    'stock_adjustments', 'stock_transfers', 'banners', 'article_categories',
    'articles', 'campaigns', 'reviews', 'faq_categories', 'faqs', 'support_tickets'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      table_name, table_name
    );
  END LOOP;
END
$$;

-- =====================================================================
-- TRIGGER NGHIỆP VỤ
-- =====================================================================

-- M01-F04/BR-M01-04: tối đa 10 địa chỉ, đúng 1 địa chỉ mặc định.
CREATE OR REPLACE FUNCTION public.enforce_address_limits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  address_count integer;
  other_default_count integer;
BEGIN
  -- Các UPDATE "hạ mặc định" do chính trigger này phát ra không chạy lại logic.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_default AND EXISTS (
      SELECT 1 FROM public.addresses
      WHERE user_id = OLD.user_id AND deleted_at IS NULL AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Không thể xóa địa chỉ mặc định khi còn địa chỉ khác (BR-M01-04)'
        USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Không được đổi chủ sở hữu địa chỉ' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_default AND NOT NEW.is_default AND NEW.deleted_at IS NULL THEN
    SELECT count(*) INTO other_default_count
    FROM public.addresses
    WHERE user_id = NEW.user_id AND is_default AND deleted_at IS NULL AND id <> NEW.id;
    IF other_default_count = 0 THEN
      RAISE EXCEPTION 'Phải chỉ định địa chỉ mặc định khác trước khi bỏ mặc định (BR-M01-04)'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_default AND NEW.deleted_at IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.addresses
      WHERE user_id = NEW.user_id AND deleted_at IS NULL AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Phải chỉ định địa chỉ mặc định khác trước khi xóa địa chỉ mặc định (BR-M01-04)'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF NEW.deleted_at IS NULL THEN
    SELECT count(*) INTO address_count
    FROM public.addresses
    WHERE user_id = NEW.user_id AND deleted_at IS NULL AND id <> NEW.id;

    IF address_count >= 10 THEN
      RAISE EXCEPTION 'Mỗi tài khoản tối đa 10 địa chỉ (M01-F04)' USING ERRCODE = 'P0001';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.addresses
      WHERE user_id = NEW.user_id AND is_default AND deleted_at IS NULL AND id <> NEW.id
    ) THEN
      NEW.is_default := true;
    END IF;

    IF NEW.is_default THEN
      UPDATE public.addresses
      SET is_default = false, updated_at = now()
      WHERE user_id = NEW.user_id AND is_default AND id <> NEW.id AND deleted_at IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_addresses_limits ON public.addresses;
CREATE TRIGGER trg_addresses_limits
  BEFORE INSERT OR UPDATE OR DELETE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_address_limits();

-- M02-F07: tối đa 10 ảnh/sản phẩm; ảnh đầu tiên tự thành thumbnail.
CREATE OR REPLACE FUNCTION public.enforce_product_image_limits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  image_count integer;
  thumbnail_count integer;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO image_count
    FROM public.product_images WHERE product_id = NEW.product_id;
    IF image_count >= 10 THEN
      RAISE EXCEPTION 'Mỗi sản phẩm tối đa 10 ảnh (M02-F07)' USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO thumbnail_count
    FROM public.product_images
    WHERE product_id = NEW.product_id AND is_thumbnail;
    IF thumbnail_count = 0 THEN
      NEW.is_thumbnail := true;
    END IF;
  END IF;

  IF NEW.is_thumbnail THEN
    UPDATE public.product_images
    SET is_thumbnail = false
    WHERE product_id = NEW.product_id AND is_thumbnail AND id <> NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_images_limits ON public.product_images;
CREATE TRIGGER trg_product_images_limits
  BEFORE INSERT OR UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_image_limits();

-- BR-M09-04: tối đa 5 banner HOME_HERO đang bật.
CREATE OR REPLACE FUNCTION public.enforce_home_banner_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  banner_count integer;
BEGIN
  IF NEW.position = 'HOME_HERO' AND NEW.is_active AND NEW.deleted_at IS NULL THEN
    SELECT count(*) INTO banner_count
    FROM public.banners
    WHERE position = 'HOME_HERO' AND is_active AND deleted_at IS NULL AND id <> NEW.id;
    IF banner_count >= 5 THEN
      RAISE EXCEPTION 'Chỉ được bật tối đa 5 banner HOME_HERO (BR-M09-04)' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_banners_limit ON public.banners;
CREATE TRIGGER trg_banners_limit
  BEFORE INSERT OR UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.enforce_home_banner_limit();

-- BR-M10-05: tối đa 5 ảnh hoặc 1 video cho mỗi review.
CREATE OR REPLACE FUNCTION public.enforce_review_media_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  media_count integer;
BEGIN
  IF NEW.media_type = 'IMAGE' THEN
    SELECT count(*) INTO media_count
    FROM public.review_media
    WHERE review_id = NEW.review_id AND media_type = 'IMAGE' AND id <> NEW.id;
    IF media_count >= 5 THEN
      RAISE EXCEPTION 'Mỗi đánh giá tối đa 5 ảnh (BR-M10-05)' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    SELECT count(*) INTO media_count
    FROM public.review_media
    WHERE review_id = NEW.review_id AND media_type = 'VIDEO' AND id <> NEW.id;
    IF media_count >= 1 THEN
      RAISE EXCEPTION 'Mỗi đánh giá tối đa 1 video (BR-M10-05)' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_media_limit ON public.review_media;
CREATE TRIGGER trg_review_media_limit
  BEFORE INSERT OR UPDATE ON public.review_media
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_media_limit();

-- BR-M10-05: giới hạn tệp đính kèm ticket (5 ảnh hoặc 1 video mỗi tin nhắn).
CREATE OR REPLACE FUNCTION public.enforce_ticket_attachment_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  attachment_count integer;
BEGIN
  IF NEW.media_type = 'IMAGE' THEN
    SELECT count(*) INTO attachment_count
    FROM public.ticket_attachments
    WHERE message_id = NEW.message_id AND media_type = 'IMAGE' AND id <> NEW.id;
    IF attachment_count >= 5 THEN
      RAISE EXCEPTION 'Mỗi tin nhắn ticket tối đa 5 ảnh (BR-M10-05)' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    SELECT count(*) INTO attachment_count
    FROM public.ticket_attachments
    WHERE message_id = NEW.message_id AND media_type = 'VIDEO' AND id <> NEW.id;
    IF attachment_count >= 1 THEN
      RAISE EXCEPTION 'Mỗi tin nhắn ticket tối đa 1 video (BR-M10-05)' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_attachment_limit ON public.ticket_attachments;
CREATE TRIGGER trg_ticket_attachment_limit
  BEFORE INSERT OR UPDATE ON public.ticket_attachments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ticket_attachment_limit();

-- M10: đồng bộ điểm đánh giá trung bình sang products khi review được duyệt/ẩn.
CREATE OR REPLACE FUNCTION public.sync_product_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  product_ids uuid[];
  target_product uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    product_ids := ARRAY[OLD.product_id];
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.product_id = NEW.product_id THEN
      product_ids := ARRAY[NEW.product_id];
    ELSE
      product_ids := ARRAY[OLD.product_id, NEW.product_id];
    END IF;
  ELSE
    product_ids := ARRAY[NEW.product_id];
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.status = NEW.status
     AND OLD.rating = NEW.rating
     AND OLD.product_id = NEW.product_id THEN
    RETURN NEW;
  END IF;

  FOREACH target_product IN ARRAY product_ids LOOP
    UPDATE public.products
    SET rating_avg = COALESCE((
          SELECT round(avg(rating)::numeric, 1)
          FROM public.reviews
          WHERE product_id = target_product AND status = 'APPROVED'
        ), 0),
        rating_count = (
          SELECT count(*) FROM public.reviews
          WHERE product_id = target_product AND status = 'APPROVED'
        )
    WHERE id = target_product;
  END LOOP;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_sync_rating ON public.reviews;
CREATE TRIGGER trg_reviews_sync_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_rating();

-- =====================================================================
-- BẢNG BẤT BIẾN (SYS-NFR-07, NFR-M06-03, NFR-M08-03)
-- =====================================================================
DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

DROP TRIGGER IF EXISTS trg_order_status_history_immutable ON public.order_status_history;
CREATE TRIGGER trg_order_status_history_immutable
  BEFORE UPDATE OR DELETE ON public.order_status_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

DROP TRIGGER IF EXISTS trg_stock_movement_logs_immutable ON public.stock_movement_logs;
CREATE TRIGGER trg_stock_movement_logs_immutable
  BEFORE UPDATE OR DELETE ON public.stock_movement_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation();

-- =====================================================================
-- HÀM NGUYÊN TỬ PL/pgSQL (§2.3, BR-M05-01, BR-M08-02, NFR-M08-01)
-- =====================================================================

-- Giữ tồn cho đơn. Idempotent theo order_ref: gọi lại trả already_reserved = true.
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_order_ref text,
  p_items jsonb,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  item_variant uuid;
  item_warehouse uuid;
  item_quantity integer;
  default_warehouse uuid;
  expires_at timestamptz := COALESCE(p_expires_at, now() + interval '20 minutes');
  item_count integer := 0;
  existing_count integer;
  stock_on_hand integer;
  stock_reserved integer;
BEGIN
  IF p_order_ref IS NULL OR btrim(p_order_ref) = '' THEN
    RAISE EXCEPTION 'ORDER_REF_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  -- Khóa theo đơn để hai request đồng thời không giữ tồn 2 lần.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_ref, 0));

  SELECT count(*) INTO existing_count
  FROM public.stock_reservations
  WHERE order_ref = p_order_ref AND status = 'ACTIVE';
  IF existing_count > 0 THEN
    RETURN jsonb_build_object(
      'order_ref', p_order_ref,
      'already_reserved', true,
      'items', existing_count
    );
  END IF;

  SELECT id INTO default_warehouse
  FROM public.warehouses
  WHERE is_default AND is_active
  LIMIT 1;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    item_variant := (item ->> 'variant_id')::uuid;
    item_warehouse := COALESCE((item ->> 'warehouse_id')::uuid, default_warehouse);
    item_quantity := (item ->> 'quantity')::integer;

    IF item_variant IS NULL OR item_quantity IS NULL OR item_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_ITEM: %', item USING ERRCODE = 'P0001';
    END IF;
    IF item_warehouse IS NULL THEN
      RAISE EXCEPTION 'WAREHOUSE_NOT_CONFIGURED' USING ERRCODE = 'P0001';
    END IF;

    SELECT on_hand, reserved INTO stock_on_hand, stock_reserved
    FROM public.inventory_stocks
    WHERE variant_id = item_variant AND warehouse_id = item_warehouse
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOCK_NOT_FOUND: variant=% warehouse=%', item_variant, item_warehouse
        USING ERRCODE = 'P0001';
    END IF;

    IF stock_on_hand - stock_reserved < item_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: variant=% available=% requested=%',
        item_variant, stock_on_hand - stock_reserved, item_quantity
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_stocks
    SET reserved = reserved + item_quantity,
        updated_at = now()
    WHERE variant_id = item_variant AND warehouse_id = item_warehouse;

    INSERT INTO public.stock_reservations (
      order_ref, variant_id, warehouse_id, quantity, status, expires_at
    ) VALUES (
      p_order_ref, item_variant, item_warehouse, item_quantity, 'ACTIVE', expires_at
    );

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note
    ) VALUES (
      item_variant, item_warehouse, 'RESERVE', item_quantity,
      stock_on_hand, stock_reserved + item_quantity, 'ORDER', p_order_ref,
      'Giữ tồn khi tạo đơn'
    );

    item_count := item_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'order_ref', p_order_ref,
    'already_reserved', false,
    'items', item_count,
    'expires_at', expires_at
  );
END;
$$;

-- Nhả toàn bộ tồn đang giữ của đơn (hủy đơn / hết hạn thanh toán).
CREATE OR REPLACE FUNCTION public.release_stock(p_order_ref text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  reservation record;
  stock_on_hand integer;
  stock_reserved integer;
  released_count integer := 0;
BEGIN
  IF p_order_ref IS NULL OR btrim(p_order_ref) = '' THEN
    RAISE EXCEPTION 'ORDER_REF_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_ref, 0));

  FOR reservation IN
    SELECT id, variant_id, warehouse_id, quantity
    FROM public.stock_reservations
    WHERE order_ref = p_order_ref AND status = 'ACTIVE'
    FOR UPDATE
  LOOP
    SELECT on_hand, reserved INTO stock_on_hand, stock_reserved
    FROM public.inventory_stocks
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOCK_NOT_FOUND: variant=% warehouse=%',
        reservation.variant_id, reservation.warehouse_id
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_stocks
    SET reserved = reserved - reservation.quantity,
        updated_at = now()
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id;

    UPDATE public.stock_reservations
    SET status = 'RELEASED', updated_at = now()
    WHERE id = reservation.id;

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note
    ) VALUES (
      reservation.variant_id, reservation.warehouse_id, 'RELEASE', -reservation.quantity,
      stock_on_hand, stock_reserved - reservation.quantity, 'ORDER', p_order_ref,
      'Nhả tồn giữ chỗ'
    );

    released_count := released_count + 1;
  END LOOP;

  RETURN jsonb_build_object('order_ref', p_order_ref, 'released_items', released_count);
END;
$$;

-- Xuất kho thực tế: giảm on_hand và reserved cho các reservation ACTIVE.
CREATE OR REPLACE FUNCTION public.fulfill_stock(p_order_ref text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  reservation record;
  stock_on_hand integer;
  stock_reserved integer;
  fulfilled_count integer := 0;
BEGIN
  IF p_order_ref IS NULL OR btrim(p_order_ref) = '' THEN
    RAISE EXCEPTION 'ORDER_REF_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_order_ref, 0));

  FOR reservation IN
    SELECT id, variant_id, warehouse_id, quantity
    FROM public.stock_reservations
    WHERE order_ref = p_order_ref AND status = 'ACTIVE'
    FOR UPDATE
  LOOP
    SELECT on_hand, reserved INTO stock_on_hand, stock_reserved
    FROM public.inventory_stocks
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOCK_NOT_FOUND: variant=% warehouse=%',
        reservation.variant_id, reservation.warehouse_id
        USING ERRCODE = 'P0001';
    END IF;

    IF stock_reserved < reservation.quantity OR stock_on_hand < reservation.quantity THEN
      RAISE EXCEPTION 'INVENTORY_INCONSISTENT: variant=% on_hand=% reserved=% quantity=%',
        reservation.variant_id, stock_on_hand, stock_reserved, reservation.quantity
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_stocks
    SET on_hand = on_hand - reservation.quantity,
        reserved = reserved - reservation.quantity,
        updated_at = now()
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id;

    UPDATE public.stock_reservations
    SET status = 'FULFILLED', updated_at = now()
    WHERE id = reservation.id;

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note
    ) VALUES (
      reservation.variant_id, reservation.warehouse_id, 'FULFILL', -reservation.quantity,
      stock_on_hand - reservation.quantity, stock_reserved - reservation.quantity,
      'ORDER', p_order_ref, 'Xuất kho thực tế'
    );

    fulfilled_count := fulfilled_count + 1;
  END LOOP;

  RETURN jsonb_build_object('order_ref', p_order_ref, 'fulfilled_items', fulfilled_count);
END;
$$;

-- Nhả tồn giữ chỗ quá hạn (M08-F07) — chạy mỗi phút bằng pg_cron.
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  reservation record;
  stock_on_hand integer;
  stock_reserved integer;
  released_count integer := 0;
BEGIN
  FOR reservation IN
    SELECT id, order_ref, variant_id, warehouse_id, quantity
    FROM public.stock_reservations
    WHERE status = 'ACTIVE' AND expires_at < now()
    ORDER BY expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT on_hand, reserved INTO stock_on_hand, stock_reserved
    FROM public.inventory_stocks
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOCK_NOT_FOUND: variant=% warehouse=%',
        reservation.variant_id, reservation.warehouse_id
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_stocks
    SET reserved = reserved - reservation.quantity,
        updated_at = now()
    WHERE variant_id = reservation.variant_id
      AND warehouse_id = reservation.warehouse_id;

    UPDATE public.stock_reservations
    SET status = 'EXPIRED', updated_at = now()
    WHERE id = reservation.id;

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note
    ) VALUES (
      reservation.variant_id, reservation.warehouse_id, 'RELEASE', -reservation.quantity,
      stock_on_hand, stock_reserved - reservation.quantity,
      'ORDER', reservation.order_ref, 'Nhả tồn giữ chỗ quá hạn'
    );

    released_count := released_count + 1;
  END LOOP;

  RETURN released_count;
END;
$$;

-- Tự hủy đơn PENDING_PAYMENT quá 20 phút (BR-M05-02) — chạy mỗi phút bằng pg_cron.
CREATE OR REPLACE FUNCTION public.cancel_timeout_orders()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  timed_out_order record;
  cancelled_count integer := 0;
BEGIN
  FOR timed_out_order IN
    SELECT id, order_code
    FROM public.orders
    WHERE status = 'PENDING_PAYMENT'
      AND payment_expires_at IS NOT NULL
      AND payment_expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.release_stock(timed_out_order.order_code);

    UPDATE public.orders
    SET status = 'CANCELLED_TIMEOUT',
        cancelled_at = now(),
        cancel_reason = 'Tự hủy do quá hạn thanh toán 20 phút (BR-M05-02)',
        updated_at = now()
    WHERE id = timed_out_order.id;

    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (
      timed_out_order.id, 'PENDING_PAYMENT', 'CANCELLED_TIMEOUT', 'SYSTEM',
      'Tự hủy sau 20 phút chờ thanh toán (BR-M05-02)'
    );

    cancelled_count := cancelled_count + 1;
  END LOOP;

  RETURN cancelled_count;
END;
$$;

-- =====================================================================
-- RLS: BẬT MẶC ĐỊNH TỪ CHỐI TRÊN MỌI BẢNG
-- Backend dùng service role (bỏ qua RLS). Không tạo policy cho anon/authenticated.
-- Module nào cần đọc công khai phải đi qua API Next.js, không query Supabase từ browser.
-- =====================================================================
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'system_settings', 'audit_logs', 'notifications',
    'users', 'addresses', 'refresh_tokens', 'password_reset_otps',
    'categories', 'brands', 'products', 'product_categories',
    'product_variants', 'product_images',
    'search_history',
    'carts', 'cart_items', 'cart_saved_items',
    'orders', 'order_items', 'payment_transactions', 'order_status_history',
    'shipments', 'shipment_events', 'shipping_fee_rules',
    'return_requests', 'return_request_items',
    'coupons', 'coupon_usages', 'membership_tiers', 'loyalty_accounts',
    'loyalty_point_transactions', 'customer_vouchers',
    'warehouses', 'suppliers', 'inventory_stocks', 'stock_reservations',
    'goods_receipts', 'goods_receipt_items', 'stock_adjustments',
    'stock_adjustment_items', 'stock_transfers', 'stock_transfer_items',
    'stock_movement_logs',
    'banners', 'article_categories', 'articles', 'campaigns', 'campaign_items',
    'reviews', 'review_media', 'faq_categories', 'faqs',
    'support_tickets', 'ticket_messages', 'ticket_attachments'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END
$$;

-- =====================================================================
-- LỊCH CHẠY NỀN — pg_cron (mỗi phút)
-- Supabase: bật extension pg_cron trong Dashboard → Database → Extensions.
-- Nếu extension chưa bật, script vẫn chạy và chỉ bỏ qua phần lịch.
-- Lưu ý: giới hạn cron của Vercel chỉ áp dụng cho /api/cron/*, không áp dụng pg_cron.
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'kaido-cancel-timeout-orders',
      '* * * * *',
      'SELECT public.cancel_timeout_orders();'
    );
    PERFORM cron.schedule(
      'kaido-release-expired-reservations',
      '* * * * *',
      'SELECT public.release_expired_reservations();'
    );
    RAISE NOTICE 'KAIDO: đã lên lịch pg_cron (hủy đơn quá hạn, nhả tồn quá hạn).';
  ELSE
    RAISE NOTICE 'KAIDO: pg_cron chưa bật — bỏ qua lịch. Xem database/README.md.';
  END IF;
END
$$;

-- =====================================================================
-- HẾT SCHEMA
-- =====================================================================
