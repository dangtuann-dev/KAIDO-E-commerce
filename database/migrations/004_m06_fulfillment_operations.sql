-- =====================================================================
-- 004 — TOY-M06: Nghiệp vụ đơn hàng & giao vận
-- Chạy SAU schema.sql, seed.sql và các migration trước đó.
-- Có thể chạy lặp lại (CREATE OR REPLACE / ADD COLUMN IF NOT EXISTS).
--
-- Nội dung:
--   1. Bổ sung mã địa bàn vào snapshot đơn hàng (phục vụ tạo vận đơn ĐVVC).
--   2. m06_create_shipment — xuất kho thực tế + tạo shipment + chuyển đơn SHIPPING
--      trong cùng một transaction (BR-M06-01, BR-M06-04, M06-F09).
--   3. m06_record_shipment_event — ghi nhật ký ĐVVC và đồng bộ trạng thái đơn
--      (M06-F10, BR-M06-03), gồm tự chuyển COMPLETED khi DELIVERED.
--   4. m06_transition_order — chuyển trạng thái đơn kèm log bất biến cho RMA.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Mã địa bàn trên đơn hàng (M05 ghi, M06 đọc khi tạo vận đơn)
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_province_code text,
  ADD COLUMN IF NOT EXISTS shipping_district_code text,
  ADD COLUMN IF NOT EXISTS shipping_ward_code text;

COMMENT ON COLUMN public.orders.shipping_province_code IS 'Mã Tỉnh/Thành phố theo danh mục hành chính — dùng cho API ĐVVC (M06-F09).';
COMMENT ON COLUMN public.orders.shipping_district_code IS 'Mã Quận/Huyện theo danh mục hành chính — dùng cho API ĐVVC (M06-F09).';
COMMENT ON COLUMN public.orders.shipping_ward_code IS 'Mã Phường/Xã theo danh mục hành chính — dùng cho API ĐVVC (M06-F09).';

-- ---------------------------------------------------------------------
-- 2. Tạo vận đơn nguyên tử
--    Gọi fulfill_stock trong cùng transaction: giữ tồn (reserved) được
--    chuyển thành xuất kho thực tế (on_hand) đúng thời điểm bàn giao ĐVVC.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m06_create_shipment(
  p_order_ref text,
  p_carrier_code text,
  p_tracking_code text,
  p_expected_delivery_date date DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_changed_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_shipment public.shipments%ROWTYPE;
  v_existing uuid;
BEGIN
  IF p_order_ref IS NULL OR btrim(p_order_ref) = '' THEN
    RAISE EXCEPTION 'ORDER_REF_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF p_carrier_code NOT IN ('GHN', 'GHTK', 'VIETTELPOST') THEN
    RAISE EXCEPTION 'INVALID_CARRIER: %', p_carrier_code USING ERRCODE = 'P0001';
  END IF;
  IF p_tracking_code IS NULL OR btrim(p_tracking_code) = '' THEN
    RAISE EXCEPTION 'TRACKING_CODE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = p_order_ref OR id::text = p_order_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_existing
  FROM public.shipments
  WHERE order_id = v_order.id AND status <> 'RETURNED'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'SHIPMENT_ALREADY_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.status <> 'PACKING' THEN
    RAISE EXCEPTION 'ORDER_NOT_PACKING: %', v_order.status USING ERRCODE = 'P0001';
  END IF;

  -- BR-M06-04: chính thức trừ tồn kho thực tế khi tạo vận đơn.
  PERFORM public.fulfill_stock(v_order.order_code);

  INSERT INTO public.shipments (
    order_id, carrier_code, tracking_code, shipping_method,
    shipping_fee, status, expected_delivery_date, note
  ) VALUES (
    v_order.id,
    p_carrier_code::public.carrier_code,
    btrim(p_tracking_code),
    v_order.shipping_method,
    v_order.shipping_fee,
    'PENDING',
    p_expected_delivery_date,
    p_note
  )
  RETURNING * INTO v_shipment;

  INSERT INTO public.shipment_events (shipment_id, status, description, raw_payload)
  VALUES (
    v_shipment.id,
    'PENDING',
    'Đã tạo vận đơn, chờ ĐVVC lấy hàng',
    jsonb_build_object('created_by', p_changed_by, 'carrier', p_carrier_code)
  );

  UPDATE public.orders
  SET status = 'SHIPPING',
      carrier_code = p_carrier_code::public.carrier_code,
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, changed_by, changed_by_role, change_source, note
  ) VALUES (
    v_order.id, v_order.status, 'SHIPPING', p_changed_by, NULL, 'STAFF',
    COALESCE(p_note, 'Tạo vận đơn ' || p_carrier_code)
  );

  RETURN jsonb_build_object(
    'shipment_id', v_shipment.id,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'carrier_code', v_shipment.carrier_code,
    'tracking_code', v_shipment.tracking_code,
    'status', v_shipment.status,
    'previous_order_status', v_order.status
  );
END;
$$;

COMMENT ON FUNCTION public.m06_create_shipment(text, text, text, date, text, uuid)
  IS 'M06-F09 — xuất kho + tạo vận đơn + chuyển đơn sang SHIPPING trong một transaction.';

-- ---------------------------------------------------------------------
-- 3. Ghi nhận sự kiện ĐVVC và đồng bộ trạng thái đơn
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m06_record_shipment_event(
  p_tracking_code text,
  p_status text,
  p_description text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_occurred_at timestamptz DEFAULT NULL,
  p_raw_payload jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_previous_order_status public.order_status;
  v_occurred_at timestamptz := COALESCE(p_occurred_at, now());
  v_failure_count integer;
  v_shipment_status public.shipment_status;
  v_note text;
BEGIN
  IF p_tracking_code IS NULL OR btrim(p_tracking_code) = '' THEN
    RAISE EXCEPTION 'TRACKING_CODE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF p_status NOT IN (
    'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'FAILED', 'RETURNING', 'RETURNED'
  ) THEN
    RAISE EXCEPTION 'INVALID_SHIPMENT_STATUS: %', p_status USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE tracking_code = btrim(p_tracking_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHIPMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_shipment.order_id
  FOR UPDATE;

  v_previous_order_status := v_order.status;
  v_shipment_status := p_status::public.shipment_status;
  v_failure_count := v_shipment.failure_count;
  IF p_status = 'FAILED' THEN
    v_failure_count := LEAST(3, v_failure_count + 1);
  END IF;
  v_note := COALESCE(p_description, 'Cập nhật từ ĐVVC: ' || p_status);

  INSERT INTO public.shipment_events (
    shipment_id, status, description, location, occurred_at, raw_payload
  ) VALUES (
    v_shipment.id, v_shipment_status, p_description, p_location, v_occurred_at, p_raw_payload
  );

  UPDATE public.shipments
  SET status = v_shipment_status,
      failure_count = v_failure_count,
      delivered_at = CASE
        WHEN p_status = 'DELIVERED' THEN COALESCE(delivered_at, v_occurred_at)
        ELSE delivered_at
      END,
      updated_at = now()
  WHERE id = v_shipment.id;

  -- DELIVERED: SHIPPING -> DELIVERED -> COMPLETED (M06-F10)
  IF p_status = 'DELIVERED' AND v_order.status = 'SHIPPING' THEN
    UPDATE public.orders SET status = 'DELIVERED', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, 'SHIPPING', 'DELIVERED', 'CARRIER', v_note);

    UPDATE public.orders
    SET status = 'COMPLETED',
        completed_at = v_occurred_at,
        payment_status = CASE
          WHEN payment_method = 'COD' THEN 'SUCCESS'::public.payment_status
          ELSE payment_status
        END,
        updated_at = now()
    WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, 'DELIVERED', 'COMPLETED', 'CARRIER', 'ĐVVC báo giao thành công');
  ELSIF p_status = 'DELIVERED' AND v_order.status = 'RETURNING' THEN
    UPDATE public.orders SET status = 'DELIVERED', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, 'RETURNING', 'DELIVERED', 'CARRIER', v_note);

  -- FAILED lần thứ 3: DELIVERY_FAILED rồi RETURNING (BR-M06-03)
  ELSIF p_status = 'FAILED' AND v_failure_count >= 3 AND v_order.status = 'SHIPPING' THEN
    UPDATE public.orders SET status = 'DELIVERY_FAILED', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, 'SHIPPING', 'DELIVERY_FAILED', 'CARRIER', 'Giao thất bại 3 lần');

    UPDATE public.orders SET status = 'RETURNING', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, 'DELIVERY_FAILED', 'RETURNING', 'CARRIER', 'Kích hoạt hoàn hàng');

    UPDATE public.shipments SET status = 'RETURNING', updated_at = now() WHERE id = v_shipment.id;

  ELSIF p_status = 'FAILED' AND v_failure_count >= 3
        AND v_order.status IN ('DELIVERED', 'COMPLETED') THEN
    UPDATE public.orders SET status = 'RETURNING', updated_at = now() WHERE id = v_order.id;
    INSERT INTO public.order_status_history (
      order_id, from_status, to_status, change_source, note
    ) VALUES (v_order.id, v_order.status, 'RETURNING', 'CARRIER', 'Kích hoạt hoàn hàng');
    UPDATE public.shipments SET status = 'RETURNING', updated_at = now() WHERE id = v_shipment.id;

  -- RETURNING: đưa đơn về trạng thái hoàn hàng đúng luồng
  ELSIF p_status = 'RETURNING' THEN
    IF v_order.status = 'SHIPPING' THEN
      UPDATE public.orders SET status = 'DELIVERY_FAILED', updated_at = now() WHERE id = v_order.id;
      INSERT INTO public.order_status_history (
        order_id, from_status, to_status, change_source, note
      ) VALUES (v_order.id, 'SHIPPING', 'DELIVERY_FAILED', 'CARRIER', 'ĐVVC trả hàng về kho');
      UPDATE public.orders SET status = 'RETURNING', updated_at = now() WHERE id = v_order.id;
      INSERT INTO public.order_status_history (
        order_id, from_status, to_status, change_source, note
      ) VALUES (v_order.id, 'DELIVERY_FAILED', 'RETURNING', 'CARRIER', v_note);
    ELSIF v_order.status IN ('DELIVERED', 'COMPLETED', 'DELIVERY_FAILED') THEN
      UPDATE public.orders SET status = 'RETURNING', updated_at = now() WHERE id = v_order.id;
      INSERT INTO public.order_status_history (
        order_id, from_status, to_status, change_source, note
      ) VALUES (v_order.id, v_order.status, 'RETURNING', 'CARRIER', v_note);
    END IF;

  -- RETURNED: hoàn tất hoàn hàng; service sẽ gọi M08 nhập lại tồn kho
  ELSIF p_status = 'RETURNED' THEN
    IF v_order.status IN ('DELIVERED', 'COMPLETED') THEN
      UPDATE public.orders SET status = 'RETURNING', updated_at = now() WHERE id = v_order.id;
      INSERT INTO public.order_status_history (
        order_id, from_status, to_status, change_source, note
      ) VALUES (v_order.id, v_order.status, 'RETURNING', 'CARRIER', v_note);
      v_previous_order_status := 'RETURNING';
    END IF;

    IF v_order.status = 'RETURNING' OR v_previous_order_status = 'RETURNING' THEN
      UPDATE public.orders SET status = 'RETURNED', updated_at = now() WHERE id = v_order.id;
      INSERT INTO public.order_status_history (
        order_id, from_status, to_status, change_source, note
      ) VALUES (v_order.id, 'RETURNING', 'RETURNED', 'CARRIER', 'Đã nhận lại hàng hoàn');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'shipment_id', v_shipment.id,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'shipment_status', p_status,
    'previous_order_status', v_previous_order_status,
    'order_status', (SELECT status FROM public.orders WHERE id = v_order.id),
    'failure_count', v_failure_count,
    'restock_needed', p_status = 'RETURNED'
  );
END;
$$;

COMMENT ON FUNCTION public.m06_record_shipment_event(text, text, text, text, timestamptz, jsonb)
  IS 'M06-F10 — ghi log ĐVVC, đồng bộ trạng thái đơn, tự COMPLETED khi DELIVERED.';

-- ---------------------------------------------------------------------
-- 4. Chuyển trạng thái đơn kèm log bất biến (RMA / thao tác hệ thống)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m06_transition_order(
  p_order_ref text,
  p_from_status text,
  p_to_status text,
  p_source text DEFAULT 'SYSTEM',
  p_note text DEFAULT NULL,
  p_changed_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_source NOT IN ('CUSTOMER', 'STAFF', 'SYSTEM', 'CARRIER') THEN
    RAISE EXCEPTION 'INVALID_CHANGE_SOURCE: %', p_source USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = p_order_ref OR id::text = p_order_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.status <> p_from_status THEN
    RAISE EXCEPTION 'STALE_ORDER_STATUS: %', v_order.status USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.orders
  SET status = p_to_status::public.order_status,
      completed_at = CASE WHEN p_to_status = 'COMPLETED' THEN now() ELSE completed_at END,
      cancelled_at = CASE
        WHEN p_to_status IN ('CANCELLED', 'CANCELLED_TIMEOUT') THEN now()
        ELSE cancelled_at
      END,
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, changed_by, change_source, note
  ) VALUES (
    v_order.id, v_order.status, p_to_status::public.order_status, p_changed_by, p_source, p_note
  );

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'previous_status', v_order.status,
    'status', p_to_status
  );
END;
$$;

COMMENT ON FUNCTION public.m06_transition_order(text, text, text, text, text, uuid)
  IS 'M06 — chuyển trạng thái đơn có kiểm tra lạc hậu (optimistic) và ghi order_status_history.';

-- ---------------------------------------------------------------------
-- 5. Tạo yêu cầu đổi trả nguyên tử (request + items + refund_amount)
--    Chỉ đơn COMPLETED trong cửa sổ đổi trả, chưa có yêu cầu đang mở.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.m06_create_return_request(
  p_order_ref text,
  p_reason text,
  p_description text,
  p_evidence_urls jsonb,
  p_items jsonb,
  p_user_id uuid DEFAULT NULL,
  p_return_window_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_request public.return_requests%ROWTYPE;
  v_item jsonb;
  v_order_item public.order_items%ROWTYPE;
  v_quantity integer;
  v_refund numeric(14, 0) := 0;
BEGIN
  IF p_reason NOT IN ('DAMAGED_IN_TRANSIT', 'DEFECTIVE', 'WRONG_ITEM', 'OTHER') THEN
    RAISE EXCEPTION 'INVALID_RETURN_REASON: %', p_reason USING ERRCODE = 'P0001';
  END IF;
  IF p_evidence_urls IS NULL OR jsonb_typeof(p_evidence_urls) <> 'array'
     OR jsonb_array_length(p_evidence_urls) = 0 THEN
    RAISE EXCEPTION 'RETURN_EVIDENCE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'RETURN_ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = p_order_ref OR id::text = p_order_ref
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'ORDER_NOT_COMPLETED: %', v_order.status USING ERRCODE = 'P0001';
  END IF;
  IF v_order.completed_at IS NULL
     OR v_order.completed_at < now() - make_interval(days => GREATEST(0, p_return_window_days)) THEN
    RAISE EXCEPTION 'RETURN_WINDOW_EXPIRED' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE order_id = v_order.id AND status IN ('PENDING_APPROVAL', 'APPROVED', 'RECEIVED')
  ) THEN
    RAISE EXCEPTION 'RETURN_ALREADY_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.return_requests (
    order_id, user_id, reason, description, evidence_urls
  ) VALUES (
    v_order.id, COALESCE(p_user_id, v_order.user_id), p_reason, p_description, p_evidence_urls
  )
  RETURNING * INTO v_request;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_order_item
    FROM public.order_items
    WHERE id = (v_item ->> 'order_item_id')::uuid AND order_id = v_order.id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'RETURN_ITEM_INVALID: %', v_item ->> 'order_item_id' USING ERRCODE = 'P0001';
    END IF;

    v_quantity := COALESCE((v_item ->> 'quantity')::integer, v_order_item.quantity);
    IF v_quantity <= 0 OR v_quantity > v_order_item.quantity THEN
      RAISE EXCEPTION 'RETURN_QUANTITY_INVALID: %', v_quantity USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.return_request_items (
      return_request_id, order_item_id, quantity, condition_note
    ) VALUES (
      v_request.id, v_order_item.id, v_quantity, NULLIF(btrim(v_item ->> 'condition_note'), '')
    );

    v_refund := v_refund + v_order_item.unit_price * v_quantity;
  END LOOP;

  UPDATE public.return_requests
  SET refund_amount = v_refund, updated_at = now()
  WHERE id = v_request.id
  RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'return_request_id', v_request.id,
    'return_code', v_request.return_code,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'status', v_request.status,
    'refund_amount', v_request.refund_amount,
    'requested_at', v_request.requested_at
  );
END;
$$;

COMMENT ON FUNCTION public.m06_create_return_request(text, text, text, jsonb, jsonb, uuid, integer)
  IS 'M06-F12 — tạo RMA nguyên tử, kiểm tra cửa sổ đổi trả và tính refund_amount từ order_items.';
