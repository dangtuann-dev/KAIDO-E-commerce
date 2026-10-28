-- =====================================================================
-- KAIDO E-COMMERCE — MIGRATION 002: M08 — Kho và tồn kho
-- Chạy SAU database/schema.sql trong Supabase SQL Editor.
-- Script idempotent: có thể chạy lặp lại.
--
-- Bổ sung cho các RPC reserve_stock/release_stock/fulfill_stock đã có:
--   * Cột VAT cho dòng phiếu nhập, mốc xuất/nhận cho phiếu chuyển kho.
--   * Truy vấn tồn kho có phân trang + ngưỡng tồn thấp (M08-F03/F11).
--   * Nhập kho NCC (M08-F02), kiểm kê + duyệt (M08-F09).
--   * Chuyển kho nội bộ 2 bước (M08-F10), nhập lại hàng hoàn (M08-F08).
--   * Thẻ kho bất biến (M08-F13), quản lý kho mặc định (M08-F01).
--
-- Quy ước trạng thái phiếu chuyển kho (document_status không có IN_TRANSIT):
--   DRAFT       = phiếu nháp, tồn chưa đổi
--   APPROVED    = đã xuất kho nguồn (hàng đang trên đường) khi shipped_at có giá trị
--   CANCELLED   = hủy khi còn nháp
--   received_at = mốc nhận đủ hàng ở kho đích (vẫn giữ APPROVED)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Bổ sung cột phục vụ nghiệp vụ
-- ---------------------------------------------------------------------
ALTER TABLE public.goods_receipt_items
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5, 2) NOT NULL DEFAULT 0
  CHECK (vat_rate >= 0 AND vat_rate <= 100);

ALTER TABLE public.stock_transfers
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 2. Sinh mã chứng từ dùng chung (GR/ADJ/TRF-YYMMDD-XXXXXX)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_document_code(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate text;
BEGIN
  LOOP
    v_candidate := upper(p_prefix) || '-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.goods_receipts WHERE code = v_candidate)
      AND NOT EXISTS (SELECT 1 FROM public.stock_adjustments WHERE code = v_candidate)
      AND NOT EXISTS (SELECT 1 FROM public.stock_transfers WHERE code = v_candidate);
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. M08-F03/F11 — Bảng tồn kho có phân trang/lọc tồn thấp
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inventory_stock_levels(
  p_keyword text DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL,
  p_low_stock_only boolean DEFAULT false,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_total integer := 0;
  v_items jsonb := '[]'::jsonb;
BEGIN
  WITH base AS (
    SELECT
      s.id AS stock_id,
      s.variant_id,
      v.sku,
      v.name AS variant_name,
      p.id AS product_id,
      p.name AS product_name,
      p.status AS product_status,
      s.warehouse_id,
      w.name AS warehouse_name,
      s.on_hand,
      s.reserved,
      s.available,
      p.low_stock_threshold,
      p.price_regular,
      s.updated_at
    FROM public.inventory_stocks s
    JOIN public.product_variants v
      ON v.id = s.variant_id AND v.deleted_at IS NULL
    JOIN public.products p
      ON p.id = v.product_id AND p.deleted_at IS NULL
    JOIN public.warehouses w
      ON w.id = s.warehouse_id AND w.is_active
    WHERE (p_warehouse_id IS NULL OR s.warehouse_id = p_warehouse_id)
      AND (
        p_keyword IS NULL
        OR btrim(p_keyword) = ''
        OR v.sku ILIKE '%' || btrim(p_keyword) || '%'
        OR p.name ILIKE '%' || btrim(p_keyword) || '%'
      )
  ),
  ranked AS (
    SELECT
      base.*,
      CASE
        WHEN base.available <= 0 THEN 'OUT_OF_STOCK'
        WHEN base.available <= base.low_stock_threshold THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END AS status
    FROM base
  ),
  filtered AS (
    SELECT *
    FROM ranked
    WHERE NOT COALESCE(p_low_stock_only, false) OR ranked.status <> 'IN_STOCK'
  ),
  paged AS (
    SELECT *
    FROM filtered
    ORDER BY
      CASE filtered.status
        WHEN 'OUT_OF_STOCK' THEN 0
        WHEN 'LOW_STOCK' THEN 1
        ELSE 2
      END,
      filtered.available ASC,
      filtered.sku ASC
    LIMIT v_limit
    OFFSET (v_page - 1) * v_limit
  )
  SELECT
    (SELECT count(*) FROM filtered),
    COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged), '[]'::jsonb)
  INTO v_total, v_items;

  RETURN jsonb_build_object(
    'total', v_total,
    'page', v_page,
    'limit', v_limit,
    'total_pages', CASE WHEN v_total = 0 THEN 0 ELSE CEIL(v_total::numeric / v_limit)::integer END,
    'items', v_items
  );
END;
$$;

-- M08-F03 — Chỉ số tổng hợp cho dashboard quản trị.
CREATE OR REPLACE FUNCTION public.inventory_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH base AS (
    SELECT
      s.on_hand,
      s.reserved,
      s.available,
      p.low_stock_threshold
    FROM public.inventory_stocks s
    JOIN public.product_variants v
      ON v.id = s.variant_id AND v.deleted_at IS NULL
    JOIN public.products p
      ON p.id = v.product_id AND p.deleted_at IS NULL
    JOIN public.warehouses w
      ON w.id = s.warehouse_id AND w.is_active
  )
  SELECT jsonb_build_object(
    'total_skus', count(*),
    'on_hand', COALESCE(sum(base.on_hand), 0),
    'reserved', COALESCE(sum(base.reserved), 0),
    'available', COALESCE(sum(base.available), 0),
    'low_stock_count', count(*) FILTER (
      WHERE base.available > 0 AND base.available <= base.low_stock_threshold
    ),
    'out_of_stock_count', count(*) FILTER (WHERE base.available <= 0),
    'warehouse_count', (SELECT count(*) FROM public.warehouses WHERE is_active)
  )
  INTO v_result
  FROM base;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. M08-F01 — Tạo/cập nhật kho và kho mặc định
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_warehouse(
  p_id uuid DEFAULT NULL,
  p_code text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_is_default boolean DEFAULT false,
  p_is_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_warehouse public.warehouses%ROWTYPE;
  v_has_default boolean;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' OR p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Mã và tên kho là bắt buộc.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('kaido:warehouse-config', 0));

  IF p_id IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.warehouses WHERE is_default AND is_active
    ) INTO v_has_default;

    IF NOT v_has_default AND p_is_active THEN
      p_is_default := true;
    END IF;

    IF p_is_default THEN
      UPDATE public.warehouses
      SET is_default = false, updated_at = now()
      WHERE is_default;
    END IF;

    INSERT INTO public.warehouses (code, name, address, phone, is_default, is_active)
    VALUES (upper(btrim(p_code)), btrim(p_name), NULLIF(btrim(p_address), ''),
            NULLIF(btrim(p_phone), ''), p_is_default, p_is_active)
    RETURNING * INTO v_warehouse;
  ELSE
    SELECT * INTO v_warehouse
    FROM public.warehouses
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy kho.' USING ERRCODE = 'P0001';
    END IF;

    IF NOT p_is_active AND v_warehouse.is_default THEN
      RAISE EXCEPTION 'Không thể vô hiệu hóa kho mặc định. Hãy đặt kho khác làm mặc định trước.'
        USING ERRCODE = 'P0001';
    END IF;

    IF v_warehouse.is_default AND NOT p_is_default THEN
      RAISE EXCEPTION 'Phải có một kho mặc định đang hoạt động.' USING ERRCODE = 'P0001';
    END IF;

    IF p_is_default THEN
      UPDATE public.warehouses
      SET is_default = false, updated_at = now()
      WHERE is_default AND id <> p_id;
    END IF;

    UPDATE public.warehouses
    SET code = upper(btrim(p_code)),
        name = btrim(p_name),
        address = NULLIF(btrim(p_address), ''),
        phone = NULLIF(btrim(p_phone), ''),
        is_default = p_is_default,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_warehouse;
  END IF;

  RETURN to_jsonb(v_warehouse);
END;
$$;

-- ---------------------------------------------------------------------
-- 5. M08-F02 — Nhập kho từ nhà cung cấp
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.receive_goods(
  p_supplier_id uuid,
  p_warehouse_id uuid,
  p_items jsonb,
  p_note text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_receipt public.goods_receipts%ROWTYPE;
  v_item jsonb;
  v_variant uuid;
  v_quantity integer;
  v_unit_cost numeric(14, 0);
  v_vat_rate numeric(5, 2);
  v_line_total numeric(14, 0);
  v_total_quantity integer := 0;
  v_total_amount numeric(14, 0) := 0;
  v_on_hand integer;
  v_reserved integer;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Phiếu nhập phải có ít nhất một dòng hàng.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses WHERE id = p_warehouse_id AND is_active
  ) THEN
    RAISE EXCEPTION 'Kho nhập không tồn tại hoặc đã ngừng hoạt động.' USING ERRCODE = 'P0001';
  END IF;

  IF p_supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND is_active
  ) THEN
    RAISE EXCEPTION 'Nhà cung cấp không tồn tại hoặc đã ngừng hợp tác.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('kaido:warehouse:' || p_warehouse_id::text, 0));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := COALESCE((v_item ->> 'unit_cost')::numeric, 0);
    v_vat_rate := COALESCE((v_item ->> 'vat_rate')::numeric, 0);

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_unit_cost < 0 THEN
      RAISE EXCEPTION 'Dòng nhập kho không hợp lệ: %', v_item USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO public.goods_receipts (
    code, supplier_id, warehouse_id, status, note, created_by, approved_by, received_at
  ) VALUES (
    public.generate_document_code('GR'), p_supplier_id, p_warehouse_id, 'APPROVED',
    NULLIF(btrim(p_note), ''), p_created_by, p_created_by, now()
  )
  RETURNING * INTO v_receipt;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := (v_item ->> 'variant_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := COALESCE((v_item ->> 'unit_cost')::numeric, 0);
    v_vat_rate := COALESCE((v_item ->> 'vat_rate')::numeric, 0);

    INSERT INTO public.goods_receipt_items (
      receipt_id, variant_id, quantity, unit_cost, vat_rate
    ) VALUES (
      v_receipt.id, v_variant, v_quantity, v_unit_cost, v_vat_rate
    );

    INSERT INTO public.inventory_stocks (variant_id, warehouse_id, on_hand, reserved)
    VALUES (v_variant, p_warehouse_id, 0, 0)
    ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

    SELECT on_hand, reserved INTO v_on_hand, v_reserved
    FROM public.inventory_stocks
    WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    UPDATE public.inventory_stocks
    SET on_hand = on_hand + v_quantity,
        updated_at = now()
    WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id;

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note, created_by
    ) VALUES (
      v_variant, p_warehouse_id, 'IMPORT', v_quantity,
      v_on_hand + v_quantity, v_reserved, 'GOODS_RECEIPT', v_receipt.code,
      COALESCE(NULLIF(btrim(p_note), ''), 'Nhập kho từ nhà cung cấp'), p_created_by
    );

    v_line_total := round(v_quantity * v_unit_cost * (1 + v_vat_rate / 100.0));
    v_total_quantity := v_total_quantity + v_quantity;
    v_total_amount := v_total_amount + v_line_total;
  END LOOP;

  UPDATE public.goods_receipts
  SET total_amount = v_total_amount, updated_at = now()
  WHERE id = v_receipt.id;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt.id,
    'code', v_receipt.code,
    'status', 'APPROVED',
    'total_quantity', v_total_quantity,
    'total_amount', v_total_amount,
    'received_at', v_receipt.received_at
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 6. M08-F09 — Kiểm kê và duyệt điều chỉnh
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_stock_adjustment(
  p_warehouse_id uuid,
  p_reason text,
  p_items jsonb,
  p_requires_admin_approval boolean,
  p_auto_approve boolean,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_adjustment public.stock_adjustments%ROWTYPE;
  v_item jsonb;
  v_variant uuid;
  v_counted integer;
  v_system integer;
  v_diff integer;
  v_item_reason text;
  v_on_hand integer;
  v_reserved integer;
  v_result_items jsonb := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Phiếu kiểm kê phải có ít nhất một dòng hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Lý do điều chỉnh tối thiểu 10 ký tự.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses WHERE id = p_warehouse_id AND is_active
  ) THEN
    RAISE EXCEPTION 'Kho kiểm kê không tồn tại hoặc đã ngừng hoạt động.' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('kaido:warehouse:' || p_warehouse_id::text, 0));

  INSERT INTO public.stock_adjustments (
    code, warehouse_id, reason, status, requires_admin_approval, approved_by, created_by
  ) VALUES (
    public.generate_document_code('ADJ'), p_warehouse_id, btrim(p_reason),
    CASE WHEN p_auto_approve THEN 'APPROVED' ELSE 'PENDING_APPROVAL' END,
    COALESCE(p_requires_admin_approval, false),
    CASE WHEN p_auto_approve THEN p_created_by ELSE NULL END,
    p_created_by
  )
  RETURNING * INTO v_adjustment;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := (v_item ->> 'variant_id')::uuid;
    v_counted := (v_item ->> 'counted_quantity')::integer;
    v_item_reason := COALESCE(NULLIF(btrim(v_item ->> 'reason'), ''), btrim(p_reason));

    IF v_variant IS NULL OR v_counted IS NULL OR v_counted < 0 THEN
      RAISE EXCEPTION 'Dòng kiểm kê không hợp lệ: %', v_item USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.inventory_stocks (variant_id, warehouse_id, on_hand, reserved)
    VALUES (v_variant, p_warehouse_id, 0, 0)
    ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

    SELECT on_hand, reserved INTO v_on_hand, v_reserved
    FROM public.inventory_stocks
    WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id
    FOR UPDATE;

    v_system := v_on_hand;
    v_diff := v_counted - v_system;

    INSERT INTO public.stock_adjustment_items (
      adjustment_id, variant_id, system_quantity, counted_quantity
    ) VALUES (
      v_adjustment.id, v_variant, v_system, v_counted
    );

    IF p_auto_approve AND v_counted < v_reserved THEN
      RAISE EXCEPTION 'Số kiểm thực tế (%) nhỏ hơn số đang giữ (%) của variant %.',
        v_counted, v_reserved, v_variant USING ERRCODE = 'P0001';
    END IF;

    IF p_auto_approve THEN
      UPDATE public.inventory_stocks
      SET on_hand = v_counted, updated_at = now()
      WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id;

      INSERT INTO public.stock_movement_logs (
        variant_id, warehouse_id, movement_type, quantity,
        on_hand_after, reserved_after, reference_type, reference_id, note, created_by
      ) VALUES (
        v_variant, p_warehouse_id, 'ADJUST', v_diff,
        v_counted, v_reserved, 'STOCK_ADJUSTMENT', v_adjustment.code, v_item_reason,
        p_created_by
      );
    END IF;

    v_result_items := v_result_items || jsonb_build_object(
      'variant_id', v_variant,
      'system_quantity', v_system,
      'counted_quantity', v_counted,
      'difference', v_diff
    );
  END LOOP;

  RETURN jsonb_build_object(
    'adjustment_id', v_adjustment.id,
    'code', v_adjustment.code,
    'status', v_adjustment.status,
    'requires_admin_approval', v_adjustment.requires_admin_approval,
    'items', v_result_items
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_stock_adjustment(
  p_adjustment_id uuid,
  p_action text,
  p_actor uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_adjustment public.stock_adjustments%ROWTYPE;
  v_item record;
  v_on_hand integer;
  v_reserved integer;
  v_new_on_hand integer;
BEGIN
  SELECT * INTO v_adjustment
  FROM public.stock_adjustments
  WHERE id = p_adjustment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kiểm kê.' USING ERRCODE = 'P0001';
  END IF;

  IF upper(COALESCE(p_action, '')) = 'CANCEL' THEN
    IF v_adjustment.status NOT IN ('DRAFT', 'PENDING_APPROVAL') THEN
      RAISE EXCEPTION 'Chỉ có thể hủy phiếu kiểm kê đang chờ duyệt.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.stock_adjustments
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = p_adjustment_id;

    RETURN jsonb_build_object(
      'adjustment_id', p_adjustment_id,
      'status', 'CANCELLED'
    );
  END IF;

  IF upper(COALESCE(p_action, '')) <> 'APPROVE' THEN
    RAISE EXCEPTION 'Hành động không hợp lệ: %', p_action USING ERRCODE = 'P0001';
  END IF;

  IF v_adjustment.status <> 'PENDING_APPROVAL' THEN
    RAISE EXCEPTION 'Chỉ duyệt được phiếu kiểm kê đang chờ duyệt.' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN
    SELECT variant_id, difference
    FROM public.stock_adjustment_items
    WHERE adjustment_id = p_adjustment_id
  LOOP
    SELECT on_hand, reserved INTO v_on_hand, v_reserved
    FROM public.inventory_stocks
    WHERE variant_id = v_item.variant_id
      AND warehouse_id = v_adjustment.warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy tồn kho của variant % trong kho %.',
        v_item.variant_id, v_adjustment.warehouse_id USING ERRCODE = 'P0001';
    END IF;

    v_new_on_hand := v_on_hand + v_item.difference;
    IF v_new_on_hand < 0 OR v_new_on_hand < v_reserved THEN
      RAISE EXCEPTION 'Không thể duyệt: tồn sau điều chỉnh (%) nhỏ hơn số đang giữ (%).',
        v_new_on_hand, v_reserved USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.inventory_stocks
    SET on_hand = v_new_on_hand, updated_at = now()
    WHERE variant_id = v_item.variant_id
      AND warehouse_id = v_adjustment.warehouse_id;

    INSERT INTO public.stock_movement_logs (
      variant_id, warehouse_id, movement_type, quantity,
      on_hand_after, reserved_after, reference_type, reference_id, note, created_by
    ) VALUES (
      v_item.variant_id, v_adjustment.warehouse_id, 'ADJUST', v_item.difference,
      v_new_on_hand, v_reserved, 'STOCK_ADJUSTMENT', v_adjustment.code,
      'Duyệt phiếu kiểm kê: ' || v_adjustment.reason, p_actor
    );
  END LOOP;

  UPDATE public.stock_adjustments
  SET status = 'APPROVED', approved_by = p_actor, updated_at = now()
  WHERE id = p_adjustment_id;

  RETURN jsonb_build_object(
    'adjustment_id', p_adjustment_id,
    'status', 'APPROVED'
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 7. M08-F10 — Chuyển kho nội bộ (DRAFT -> SHIP -> RECEIVE)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_stock_transfer(
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_items jsonb,
  p_note text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transfer public.stock_transfers%ROWTYPE;
  v_item jsonb;
  v_variant uuid;
  v_quantity integer;
BEGIN
  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Kho nguồn và kho đích phải khác nhau.' USING ERRCODE = 'P0001';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Phiếu chuyển kho phải có ít nhất một dòng hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses
    WHERE id IN (p_from_warehouse_id, p_to_warehouse_id) AND is_active
    GROUP BY true HAVING count(*) = 2
  ) THEN
    RAISE EXCEPTION 'Kho nguồn hoặc kho đích không tồn tại/đã ngừng hoạt động.'
      USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item ->> 'quantity')::integer;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Số lượng chuyển kho phải lớn hơn 0.' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO public.stock_transfers (
    code, from_warehouse_id, to_warehouse_id, status, note, created_by
  ) VALUES (
    public.generate_document_code('TRF'), p_from_warehouse_id, p_to_warehouse_id,
    'DRAFT', NULLIF(btrim(p_note), ''), p_created_by
  )
  RETURNING * INTO v_transfer;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := (v_item ->> 'variant_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;

    IF v_variant IS NULL THEN
      RAISE EXCEPTION 'Dòng chuyển kho thiếu variant_id.' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.stock_transfer_items (transfer_id, variant_id, quantity)
    VALUES (v_transfer.id, v_variant, v_quantity);
  END LOOP;

  RETURN jsonb_build_object(
    'transfer_id', v_transfer.id,
    'code', v_transfer.code,
    'status', v_transfer.status,
    'created_at', v_transfer.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_stock_transfer(
  p_transfer_id uuid,
  p_action text,
  p_actor uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transfer public.stock_transfers%ROWTYPE;
  v_item record;
  v_on_hand integer;
  v_reserved integer;
  v_action text := upper(COALESCE(p_action, ''));
BEGIN
  SELECT * INTO v_transfer
  FROM public.stock_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu chuyển kho.' USING ERRCODE = 'P0001';
  END IF;

  IF v_action = 'SHIP' THEN
    IF v_transfer.status <> 'DRAFT' THEN
      RAISE EXCEPTION 'Chỉ xuất kho được phiếu chuyển đang ở trạng thái nháp.'
        USING ERRCODE = 'P0001';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('kaido:warehouse:' || v_transfer.from_warehouse_id::text, 0)
    );

    FOR v_item IN
      SELECT variant_id, quantity
      FROM public.stock_transfer_items
      WHERE transfer_id = p_transfer_id
    LOOP
      SELECT on_hand, reserved INTO v_on_hand, v_reserved
      FROM public.inventory_stocks
      WHERE variant_id = v_item.variant_id
        AND warehouse_id = v_transfer.from_warehouse_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy tồn kho của variant % tại kho nguồn.',
          v_item.variant_id USING ERRCODE = 'P0001';
      END IF;

      IF v_on_hand - v_reserved < v_item.quantity THEN
        RAISE EXCEPTION 'Không đủ tồn khả dụng để chuyển: variant %, cần %, còn %.',
          v_item.variant_id, v_item.quantity, v_on_hand - v_reserved
          USING ERRCODE = 'P0001';
      END IF;

      UPDATE public.inventory_stocks
      SET on_hand = on_hand - v_item.quantity, updated_at = now()
      WHERE variant_id = v_item.variant_id
        AND warehouse_id = v_transfer.from_warehouse_id;

      INSERT INTO public.stock_movement_logs (
        variant_id, warehouse_id, movement_type, quantity,
        on_hand_after, reserved_after, reference_type, reference_id, note, created_by
      ) VALUES (
        v_item.variant_id, v_transfer.from_warehouse_id, 'TRANSFER_OUT', -v_item.quantity,
        v_on_hand - v_item.quantity, v_reserved, 'STOCK_TRANSFER', v_transfer.code,
        'Xuất kho nguồn để chuyển kho', p_actor
      );
    END LOOP;

    UPDATE public.stock_transfers
    SET status = 'APPROVED', shipped_at = now(), approved_by = p_actor, updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO v_transfer;
  ELSIF v_action = 'RECEIVE' THEN
    IF v_transfer.status <> 'APPROVED' OR v_transfer.shipped_at IS NULL THEN
      RAISE EXCEPTION 'Phiếu chuyển chưa được xuất kho nguồn.' USING ERRCODE = 'P0001';
    END IF;
    IF v_transfer.received_at IS NOT NULL THEN
      RAISE EXCEPTION 'Phiếu chuyển đã được nhận trước đó.' USING ERRCODE = 'P0001';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('kaido:warehouse:' || v_transfer.to_warehouse_id::text, 0)
    );

    FOR v_item IN
      SELECT variant_id, quantity
      FROM public.stock_transfer_items
      WHERE transfer_id = p_transfer_id
    LOOP
      INSERT INTO public.inventory_stocks (variant_id, warehouse_id, on_hand, reserved)
      VALUES (v_item.variant_id, v_transfer.to_warehouse_id, 0, 0)
      ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

      SELECT on_hand, reserved INTO v_on_hand, v_reserved
      FROM public.inventory_stocks
      WHERE variant_id = v_item.variant_id
        AND warehouse_id = v_transfer.to_warehouse_id
      FOR UPDATE;

      UPDATE public.inventory_stocks
      SET on_hand = on_hand + v_item.quantity, updated_at = now()
      WHERE variant_id = v_item.variant_id
        AND warehouse_id = v_transfer.to_warehouse_id;

      INSERT INTO public.stock_movement_logs (
        variant_id, warehouse_id, movement_type, quantity,
        on_hand_after, reserved_after, reference_type, reference_id, note, created_by
      ) VALUES (
        v_item.variant_id, v_transfer.to_warehouse_id, 'TRANSFER_IN', v_item.quantity,
        v_on_hand + v_item.quantity, v_reserved, 'STOCK_TRANSFER', v_transfer.code,
        'Nhận hàng chuyển kho', p_actor
      );
    END LOOP;

    UPDATE public.stock_transfers
    SET received_at = now(), received_by = p_actor, updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO v_transfer;
  ELSIF v_action = 'CANCEL' THEN
    IF v_transfer.status <> 'DRAFT' THEN
      RAISE EXCEPTION 'Chỉ hủy được phiếu chuyển đang ở trạng thái nháp.'
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.stock_transfers
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = p_transfer_id
    RETURNING * INTO v_transfer;
  ELSE
    RAISE EXCEPTION 'Hành động không hợp lệ: %', p_action USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'transfer_id', v_transfer.id,
    'code', v_transfer.code,
    'status', v_transfer.status,
    'shipped_at', v_transfer.shipped_at,
    'received_at', v_transfer.received_at
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 8. M08-F08 — Nhập lại hàng hoàn/đổi trả
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.receive_returned_stock(
  p_order_ref text,
  p_warehouse_id uuid,
  p_items jsonb,
  p_note text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item jsonb;
  v_variant uuid;
  v_quantity integer;
  v_condition text;
  v_on_hand integer;
  v_reserved integer;
  v_sellable integer := 0;
  v_damaged integer := 0;
BEGIN
  IF p_order_ref IS NULL OR btrim(p_order_ref) = '' THEN
    RAISE EXCEPTION 'Mã đơn hoàn là bắt buộc.' USING ERRCODE = 'P0001';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Danh sách hàng hoàn là bắt buộc.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses WHERE id = p_warehouse_id AND is_active
  ) THEN
    RAISE EXCEPTION 'Kho nhận hàng hoàn không tồn tại hoặc đã ngừng hoạt động.'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('kaido:return:' || btrim(p_order_ref), 0));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_variant := (v_item ->> 'variant_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    v_condition := upper(COALESCE(v_item ->> 'condition', 'SELLABLE'));

    IF v_variant IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Dòng hàng hoàn không hợp lệ: %', v_item USING ERRCODE = 'P0001';
    END IF;
    IF v_condition NOT IN ('SELLABLE', 'DAMAGED') THEN
      RAISE EXCEPTION 'Tình trạng hàng hoàn không hợp lệ: %', v_condition
        USING ERRCODE = 'P0001';
    END IF;

    IF v_condition = 'SELLABLE' THEN
      INSERT INTO public.inventory_stocks (variant_id, warehouse_id, on_hand, reserved)
      VALUES (v_variant, p_warehouse_id, 0, 0)
      ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

      SELECT on_hand, reserved INTO v_on_hand, v_reserved
      FROM public.inventory_stocks
      WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id
      FOR UPDATE;

      UPDATE public.inventory_stocks
      SET on_hand = on_hand + v_quantity, updated_at = now()
      WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id;

      INSERT INTO public.stock_movement_logs (
        variant_id, warehouse_id, movement_type, quantity,
        on_hand_after, reserved_after, reference_type, reference_id, note, created_by
      ) VALUES (
        v_variant, p_warehouse_id, 'RETURN', v_quantity,
        v_on_hand + v_quantity, v_reserved, 'RETURN', btrim(p_order_ref),
        COALESCE(NULLIF(btrim(p_note), ''), 'Nhập lại hàng hoàn nguyên vẹn'), p_created_by
      );

      v_sellable := v_sellable + v_quantity;
    ELSE
      SELECT on_hand, reserved INTO v_on_hand, v_reserved
      FROM public.inventory_stocks
      WHERE variant_id = v_variant AND warehouse_id = p_warehouse_id;

      INSERT INTO public.stock_movement_logs (
        variant_id, warehouse_id, movement_type, quantity,
        on_hand_after, reserved_after, reference_type, reference_id, note, created_by
      ) VALUES (
        v_variant, p_warehouse_id, 'RETURN', 0,
        COALESCE(v_on_hand, 0), COALESCE(v_reserved, 0), 'RETURN', btrim(p_order_ref),
        'Hàng hoàn lỗi — không nhập tồn khả dụng', p_created_by
      );

      v_damaged := v_damaged + v_quantity;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'order_ref', btrim(p_order_ref),
    'warehouse_id', p_warehouse_id,
    'sellable_quantity', v_sellable,
    'damaged_quantity', v_damaged
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 9. M08-F13 — Thẻ kho bất biến (tồn đầu/cuối kỳ + biến động)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stock_card(
  p_sku text,
  p_warehouse_id uuid,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_variant record;
  v_warehouse record;
  v_from timestamptz := COALESCE(p_from, now() - interval '30 days');
  v_to timestamptz := COALESCE(p_to, now());
  v_open_on_hand integer := 0;
  v_open_reserved integer := 0;
  v_close_on_hand integer := 0;
  v_close_reserved integer := 0;
  v_movements jsonb := '[]'::jsonb;
BEGIN
  SELECT v.id, v.sku, v.name AS variant_name, p.name AS product_name
  INTO v_variant
  FROM public.product_variants v
  JOIN public.products p ON p.id = v.product_id
  WHERE upper(v.sku) = upper(btrim(p_sku)) AND v.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy SKU %.', p_sku USING ERRCODE = 'P0001';
  END IF;

  SELECT id, name INTO v_warehouse
  FROM public.warehouses
  WHERE id = p_warehouse_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy kho.' USING ERRCODE = 'P0001';
  END IF;

  IF v_to < v_from THEN
    RAISE EXCEPTION 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' USING ERRCODE = 'P0001';
  END IF;

  SELECT m.on_hand_after, m.reserved_after
  INTO v_open_on_hand, v_open_reserved
  FROM public.stock_movement_logs m
  WHERE m.variant_id = v_variant.id
    AND m.warehouse_id = p_warehouse_id
    AND m.created_at < v_from
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1;

  v_open_on_hand := COALESCE(v_open_on_hand, 0);
  v_open_reserved := COALESCE(v_open_reserved, 0);

  SELECT m.on_hand_after, m.reserved_after
  INTO v_close_on_hand, v_close_reserved
  FROM public.stock_movement_logs m
  WHERE m.variant_id = v_variant.id
    AND m.warehouse_id = p_warehouse_id
    AND m.created_at <= v_to
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1;

  v_close_on_hand := COALESCE(v_close_on_hand, v_open_on_hand);
  v_close_reserved := COALESCE(v_close_reserved, v_open_reserved);

  SELECT COALESCE(
    jsonb_agg(to_jsonb(t) ORDER BY t.created_at ASC, t.id ASC),
    '[]'::jsonb
  )
  INTO v_movements
  FROM (
    SELECT
      m.id,
      m.movement_type,
      m.quantity,
      m.on_hand_after,
      m.reserved_after,
      m.reference_type,
      m.reference_id,
      m.note,
      m.created_at,
      u.full_name AS actor_name
    FROM public.stock_movement_logs m
    LEFT JOIN public.users u ON u.id = m.created_by
    WHERE m.variant_id = v_variant.id
      AND m.warehouse_id = p_warehouse_id
      AND m.created_at >= v_from
      AND m.created_at <= v_to
    ORDER BY m.created_at ASC, m.id ASC
    LIMIT 500
  ) t;

  RETURN jsonb_build_object(
    'sku', v_variant.sku,
    'variant_name', v_variant.variant_name,
    'product_name', v_variant.product_name,
    'warehouse_id', v_warehouse.id,
    'warehouse_name', v_warehouse.name,
    'from_date', v_from,
    'to_date', v_to,
    'opening', jsonb_build_object('on_hand', v_open_on_hand, 'reserved', v_open_reserved),
    'closing', jsonb_build_object('on_hand', v_close_on_hand, 'reserved', v_close_reserved),
    'movements', v_movements
  );
END;
$$;

-- =====================================================================
-- HẾT MIGRATION 002
-- =====================================================================
