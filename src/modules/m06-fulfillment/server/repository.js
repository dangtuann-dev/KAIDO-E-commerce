import 'server-only';

/**
 * [SERVER] TOY-M06 — Repository giao vận/đổi trả.
 * Chỉ ánh xạ dữ liệu Supabase; business rule nằm ở service.
 * Ghi trạng thái đơn qua RPC PL/pgSQL (m06_*) để giữ nguyên tử và log bất biến.
 */
import { getSupabaseAdmin, rpc } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M06 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'shipments',
  'shipment_events',
  'shipping_fee_rules',
  'return_requests',
  'return_request_items',
]);

const table = (name) => getSupabaseAdmin().from(name);

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data ?? [];
}

async function runOne(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data ?? null;
}

async function runPage(builder) {
  const { data, error, count } = await builder;
  if (error) throw fromSupabaseError(error);
  return { rows: data ?? [], total: count ?? 0 };
}

const SHIPMENT_COLUMNS = [
  'id',
  'order_id',
  'carrier_code',
  'tracking_code',
  'shipping_method',
  'shipping_fee',
  'status',
  'expected_delivery_date',
  'delivered_at',
  'failure_count',
  'note',
  'created_at',
  'updated_at',
].join(',');

const SHIPMENT_ORDER_EMBED =
  'orders!inner(order_code,user_id,status,payment_method,shipping_method,total_amount,' +
  'recipient_name,recipient_phone,recipient_email)';

const SHIPMENT_WITH_ORDER_COLUMNS = `${SHIPMENT_COLUMNS},${SHIPMENT_ORDER_EMBED}`;

const SHIPMENT_EVENT_COLUMNS =
  'id,shipment_id,status,description,location,occurred_at,created_at';

const RETURN_COLUMNS = [
  'id',
  'return_code',
  'order_id',
  'user_id',
  'status',
  'reason',
  'description',
  'evidence_urls',
  'refund_amount',
  'admin_note',
  'requested_at',
  'approved_at',
  'rejected_at',
  'received_at',
  'completed_at',
  'created_at',
  'updated_at',
].join(',');

const RETURN_ORDER_EMBED =
  'orders!inner(order_code,user_id,status,payment_method,total_amount,' +
  'recipient_name,recipient_phone,completed_at)';

const RETURN_SUMMARY_COLUMNS =
  `${RETURN_COLUMNS},${RETURN_ORDER_EMBED},return_request_items(id,order_item_id,quantity)`;

const RETURN_DETAIL_COLUMNS =
  `${RETURN_COLUMNS},${RETURN_ORDER_EMBED},` +
  'return_request_items(id,order_item_id,quantity,condition_note,' +
  'order_items(sku,variant_id,product_name,variant_name,unit_price,quantity))';

const FEE_RULE_COLUMNS =
  'id,name,region_type,province_code,shipping_method,base_fee,free_shipping_threshold,' +
  'effective_from,effective_to,is_active';

/* ------------------------------------------------------------------ */
/* RPC nghiệp vụ                                                      */
/* ------------------------------------------------------------------ */

export async function createShipmentRpc({
  orderRef,
  carrierCode,
  trackingCode,
  expectedDeliveryDate,
  note,
  changedBy,
}) {
  return rpc('m06_create_shipment', {
    p_order_ref: orderRef,
    p_carrier_code: carrierCode,
    p_tracking_code: trackingCode,
    p_expected_delivery_date: expectedDeliveryDate ?? null,
    p_note: note ?? null,
    p_changed_by: changedBy ?? null,
  });
}

export async function recordShipmentEventRpc({
  trackingCode,
  status,
  description,
  location,
  occurredAt,
  rawPayload,
}) {
  return rpc('m06_record_shipment_event', {
    p_tracking_code: trackingCode,
    p_status: status,
    p_description: description ?? null,
    p_location: location ?? null,
    p_occurred_at: occurredAt ?? null,
    p_raw_payload: rawPayload ?? null,
  });
}

export async function transitionOrderRpc({
  orderRef,
  fromStatus,
  toStatus,
  source,
  note,
  changedBy,
}) {
  return rpc('m06_transition_order', {
    p_order_ref: orderRef,
    p_from_status: fromStatus,
    p_to_status: toStatus,
    p_source: source,
    p_note: note ?? null,
    p_changed_by: changedBy ?? null,
  });
}

export async function createReturnRequestRpc({
  orderRef,
  reason,
  description,
  evidenceUrls,
  items,
  userId,
  returnWindowDays,
}) {
  return rpc('m06_create_return_request', {
    p_order_ref: orderRef,
    p_reason: reason,
    p_description: description ?? null,
    p_evidence_urls: evidenceUrls ?? [],
    p_items: items,
    p_user_id: userId ?? null,
    p_return_window_days: returnWindowDays,
  });
}

/* ------------------------------------------------------------------ */
/* shipments                                                          */
/* ------------------------------------------------------------------ */

export async function findShipmentByOrder(orderId) {
  return runOne(
    table('shipments')
      .select(SHIPMENT_WITH_ORDER_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function findShipmentByTracking(trackingCode) {
  return runOne(
    table('shipments')
      .select(SHIPMENT_WITH_ORDER_COLUMNS)
      .eq('tracking_code', trackingCode)
      .maybeSingle(),
  );
}

export async function listShipments({ status, carrierCode, fromDate, toDate, page = 1, limit = 20 }) {
  const offset = (Math.max(1, page) - 1) * limit;
  let builder = table('shipments').select(SHIPMENT_WITH_ORDER_COLUMNS, { count: 'exact' });

  if (status) builder = builder.eq('status', status);
  if (carrierCode) builder = builder.eq('carrier_code', carrierCode);
  if (fromDate) builder = builder.gte('created_at', `${fromDate}T00:00:00.000Z`);
  if (toDate) builder = builder.lte('created_at', `${toDate}T23:59:59.999Z`);

  return runPage(builder.order('created_at', { ascending: false }).range(offset, offset + limit - 1));
}

export async function listShipmentStats({ carrierCode, fromDate, toDate } = {}) {
  let builder = table('shipments').select('status,carrier_code');
  if (carrierCode) builder = builder.eq('carrier_code', carrierCode);
  if (fromDate) builder = builder.gte('created_at', `${fromDate}T00:00:00.000Z`);
  if (toDate) builder = builder.lte('created_at', `${toDate}T23:59:59.999Z`);

  return run(builder);
}

export async function listShipmentEvents(shipmentId) {
  return run(
    table('shipment_events')
      .select(SHIPMENT_EVENT_COLUMNS)
      .eq('shipment_id', shipmentId)
      .order('occurred_at', { ascending: true }),
  );
}

export async function findShipmentEventByExternal({ trackingCode, status, occurredAt }) {
  let builder = table('shipment_events')
    .select(`${SHIPMENT_EVENT_COLUMNS},shipments!inner(tracking_code)`)
    .eq('shipments.tracking_code', trackingCode)
    .eq('status', status);

  if (occurredAt) builder = builder.eq('occurred_at', occurredAt);

  return runOne(builder.order('created_at', { ascending: false }).limit(1).maybeSingle());
}

/* ------------------------------------------------------------------ */
/* shipping_fee_rules                                                 */
/* ------------------------------------------------------------------ */

export async function listActiveShippingFeeRules(shippingMethod) {
  const today = new Date().toISOString().slice(0, 10);
  let builder = table('shipping_fee_rules')
    .select(FEE_RULE_COLUMNS)
    .eq('is_active', true)
    .lte('effective_from', today)
    .order('base_fee', { ascending: true });

  if (shippingMethod) builder = builder.eq('shipping_method', shippingMethod);

  const rows = await run(builder);
  return rows.filter((rule) => !rule.effective_to || rule.effective_to >= today);
}

/* ------------------------------------------------------------------ */
/* return_requests / return_request_items                             */
/* ------------------------------------------------------------------ */

export async function listReturnRequests({ status, fromDate, toDate, page = 1, limit = 20 }) {
  const offset = (Math.max(1, page) - 1) * limit;
  let builder = table('return_requests').select(RETURN_SUMMARY_COLUMNS, { count: 'exact' });

  if (status) builder = builder.eq('status', status);
  if (fromDate) builder = builder.gte('requested_at', `${fromDate}T00:00:00.000Z`);
  if (toDate) builder = builder.lte('requested_at', `${toDate}T23:59:59.999Z`);

  return runPage(
    builder.order('requested_at', { ascending: false }).range(offset, offset + limit - 1),
  );
}

export async function findReturnRequestById(id) {
  return runOne(table('return_requests').select(RETURN_DETAIL_COLUMNS).eq('id', id).maybeSingle());
}

export async function listReturnRequestsByOrder(orderId) {
  return run(
    table('return_requests')
      .select(RETURN_DETAIL_COLUMNS)
      .eq('order_id', orderId)
      .order('requested_at', { ascending: false }),
  );
}

export async function findActiveReturnRequest(orderId) {
  return runOne(
    table('return_requests')
      .select('id,return_code,status,requested_at')
      .eq('order_id', orderId)
      .in('status', ['PENDING_APPROVAL', 'APPROVED', 'RECEIVED'])
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function updateReturnRequestStatus(id, status, patch = {}) {
  return runOne(
    table('return_requests')
      .update({ ...patch, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(RETURN_COLUMNS)
      .single(),
  );
}

/* ------------------------------------------------------------------ */
/* notifications (hàng đợi email — worker nằm ngoài phạm vi)          */
/* ------------------------------------------------------------------ */

export async function enqueueNotification(row) {
  return run(table('notifications').insert(row).select('id').maybeSingle());
}
