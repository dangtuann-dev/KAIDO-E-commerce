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
