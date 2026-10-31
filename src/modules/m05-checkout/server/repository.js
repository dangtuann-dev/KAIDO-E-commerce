import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M05 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'orders',
  'order_items',
  'payment_transactions',
  'order_status_history',
]);

/**
 * Repository chỉ ánh xạ dữ liệu; business rule nằm ở service.
 */
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

/** Cột đơn hàng dùng chung — snapshot người nhận/giá (BR-M05-05). */
const ORDER_COLUMNS = [
  'id',
  'order_code',
  'user_id',
  'status',
  'payment_status',
  'payment_method',
  'shipping_method',
  'carrier_code',
  'currency',
  'subtotal',
  'discount_amount',
  'points_discount_amount',
  'shipping_fee',
  'total_amount',
  'coupon_id',
  'coupon_code',
  'freeship_coupon_id',
  'freeship_coupon_code',
  'points_used',
  'recipient_name',
  'recipient_phone',
  'recipient_email',
  'shipping_province',
  'shipping_district',
  'shipping_ward',
  'shipping_address',
  'note',
  'cancel_reason',
  'payment_expires_at',
  'placed_at',
  'confirmed_at',
  'completed_at',
  'cancelled_at',
  'created_at',
  'updated_at',
].join(',');

const ORDER_ITEM_COLUMNS = [
  'id',
  'order_id',
  'product_id',
  'variant_id',
  'sku',
  'product_name',
  'variant_name',
  'image_url',
  'unit_price',
  'quantity',
  'line_total',
  'product_snapshot',
  'created_at',
].join(',');

const PAYMENT_COLUMNS = [
  'id',
  'order_id',
  'provider',
  'transaction_ref',
  'provider_transaction_id',
  'amount',
  'status',
  'idempotency_key',
  'response_payload',
  'paid_at',
  'created_at',
  'updated_at',
].join(',');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ------------------------------------------------------------------ */
/* addresses (M01 — M05 chỉ đọc để chụp snapshot người nhận)          */
/* ------------------------------------------------------------------ */

export async function findAddressForUser(userId, addressId) {
  return runOne(
    table('addresses')
      .select(
        'id,user_id,recipient_name,phone,province_code,province_name,district_code,district_name,' +
          'ward_code,ward_name,street_address,is_default',
      )
      .eq('id', addressId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

export async function findDefaultAddressForUser(userId) {
  return runOne(
    table('addresses')
      .select(
        'id,user_id,recipient_name,phone,province_code,province_name,district_code,district_name,' +
          'ward_code,ward_name,street_address,is_default',
      )
      .eq('user_id', userId)
      .eq('is_default', true)
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

/* ------------------------------------------------------------------ */
/* shipping_fee_rules (M06 sở hữu dữ liệu, M05 chỉ đọc để báo phí)    */
/* ------------------------------------------------------------------ */

export async function listActiveShippingFeeRules(shippingMethod) {
  const today = new Date().toISOString().slice(0, 10);
  let builder = table('shipping_fee_rules')
    .select(
      'id,name,region_type,province_code,shipping_method,base_fee,free_shipping_threshold,' +
        'effective_from,effective_to,is_active',
    )
    .eq('is_active', true)
    .lte('effective_from', today)
    .order('base_fee', { ascending: true });

  if (shippingMethod) builder = builder.eq('shipping_method', shippingMethod);

  const rules = await run(builder);
  return rules.filter((rule) => !rule.effective_to || rule.effective_to >= today);
}

/* ------------------------------------------------------------------ */
/* orders (M05-F06, F10, F11)                                         */
/* ------------------------------------------------------------------ */

export async function insertOrder(payload) {
  return runOne(table('orders').insert(payload).select(ORDER_COLUMNS).single());
}

export async function findOrderByRef(orderRef) {
  const reference = String(orderRef ?? '').trim();
  if (!reference) return null;

  const builder = table('orders').select(ORDER_COLUMNS);
  const query = UUID_PATTERN.test(reference)
    ? builder.eq('id', reference)
    : builder.eq('order_code', reference);

  return runOne(query.maybeSingle());
}

export async function findOrderById(orderId) {
  return runOne(table('orders').select(ORDER_COLUMNS).eq('id', orderId).maybeSingle());
}

export async function updateOrder(orderId, patch) {
  return runOne(
    table('orders')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select(ORDER_COLUMNS)
      .single(),
  );
}

export async function listOrdersByUser(userId, { status, page = 1, limit = 10 } = {}) {
  const from = (Math.max(1, page) - 1) * limit;
  let builder = table('orders').select(ORDER_COLUMNS, { count: 'exact' }).eq('user_id', userId);
  if (status) builder = builder.eq('status', status);

  return runPage(builder.order('created_at', { ascending: false }).range(from, from + limit - 1));
}

export async function listAdminOrders({
  status,
  search,
  fromDate,
  toDate,
  page = 1,
  limit = 20,
} = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  let builder = table('orders').select(ORDER_COLUMNS, { count: 'exact' });

  if (status) builder = builder.eq('status', status);
  if (fromDate) builder = builder.gte('created_at', `${fromDate}T00:00:00.000Z`);
  if (toDate) builder = builder.lte('created_at', `${toDate}T23:59:59.999Z`);
  if (search) {
    const keyword = String(search).trim();
    builder = builder.or(
      [
        `order_code.ilike.%${keyword}%`,
        `recipient_name.ilike.%${keyword}%`,
        `recipient_phone.ilike.%${keyword}%`,
        `recipient_email.ilike.%${keyword}%`,
      ].join(','),
    );
  }

  return runPage(builder.order('created_at', { ascending: false }).range(offset, offset + limit - 1));
}

export async function countOrdersByStatus({ search, fromDate, toDate } = {}) {
  let builder = table('orders').select('status');
  if (fromDate) builder = builder.gte('created_at', `${fromDate}T00:00:00.000Z`);
  if (toDate) builder = builder.lte('created_at', `${toDate}T23:59:59.999Z`);
  if (search) {
    const keyword = String(search).trim();
    builder = builder.or(
      [
        `order_code.ilike.%${keyword}%`,
        `recipient_name.ilike.%${keyword}%`,
        `recipient_phone.ilike.%${keyword}%`,
        `recipient_email.ilike.%${keyword}%`,
      ].join(','),
    );
  }

  const rows = await run(builder);
  const counts = {};
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return { total: rows.length, counts };
}

export async function listUsersByIds(userIds) {
  const ids = [...new Set((userIds ?? []).filter(Boolean))];
  if (ids.length === 0) return [];
  return run(table('users').select('id,full_name,email,phone').in('id', ids));
}

/* ------------------------------------------------------------------ */
/* order_items (M05-F06)                                              */
/* ------------------------------------------------------------------ */

export async function insertOrderItems(rows) {
  if (!rows || rows.length === 0) return [];
  return run(table('order_items').insert(rows).select(ORDER_ITEM_COLUMNS));
}

export async function listOrderItems(orderId) {
  return run(
    table('order_items')
      .select(ORDER_ITEM_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
  );
}

export async function listOrderItemsForOrders(orderIds) {
  const ids = [...new Set((orderIds ?? []).filter(Boolean))];
  if (ids.length === 0) return [];
  return run(table('order_items').select(ORDER_ITEM_COLUMNS).in('order_id', ids));
}

/* ------------------------------------------------------------------ */
/* payment_transactions (M05-F04, F07 — idempotency bắt buộc)         */
/* ------------------------------------------------------------------ */

export async function insertPaymentTransaction(payload) {
  return runOne(
    table('payment_transactions').insert(payload).select(PAYMENT_COLUMNS).single(),
  );
}

export async function findPaymentTransactionByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) return null;
  return runOne(
    table('payment_transactions')
      .select(PAYMENT_COLUMNS)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle(),
  );
}

export async function findPaymentTransactionByProvider(provider, providerTransactionId) {
  if (!providerTransactionId) return null;
  return runOne(
    table('payment_transactions')
      .select(PAYMENT_COLUMNS)
      .eq('provider', provider)
      .eq('provider_transaction_id', providerTransactionId)
      .maybeSingle(),
  );
}

export async function findLatestPaymentTransaction(orderId) {
  return runOne(
    table('payment_transactions')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function listPaymentTransactions(orderId) {
  return run(
    table('payment_transactions')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false }),
  );
}

export async function updatePaymentTransaction(transactionId, patch) {
  return runOne(
    table('payment_transactions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', transactionId)
      .select(PAYMENT_COLUMNS)
      .single(),
  );
}

/* ------------------------------------------------------------------ */
/* order_status_history (bất biến — chỉ INSERT/SELECT)                */
/* ------------------------------------------------------------------ */

export async function insertOrderStatusHistory(row) {
  return runOne(table('order_status_history').insert(row).select().single());
}

export async function listOrderStatusHistory(orderId) {
  return run(
    table('order_status_history')
      .select('id,order_id,from_status,to_status,changed_by,changed_by_role,change_source,note,created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
  );
}

/* ------------------------------------------------------------------ */
/* notifications (hàng đợi email — module worker nằm ngoài phạm vi)    */
/* ------------------------------------------------------------------ */

export async function enqueueNotification(row) {
  return run(table('notifications').insert(row).select('id').maybeSingle());
}
