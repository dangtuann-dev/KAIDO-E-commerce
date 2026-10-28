import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M08 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'warehouses',
  'suppliers',
  'inventory_stocks',
  'stock_reservations',
  'goods_receipts',
  'goods_receipt_items',
  'stock_adjustments',
  'stock_adjustment_items',
  'stock_transfers',
  'stock_transfer_items',
  'stock_movement_logs',
]);

/** Repository chỉ ánh xạ dữ liệu; business rule nằm ở service. */
const table = (name) => getSupabaseAdmin().from(name);

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data;
}

async function runWithCount(builder) {
  const { data, error, count } = await builder;
  if (error) throw fromSupabaseError(error);
  return { rows: data ?? [], total: count ?? 0 };
}

async function callRpc(name, args) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (error) throw fromSupabaseError(error);
  return data;
}

/* ------------------------------------------------------------------ */
/* Inventory stock (M08-F03/F04)                                       */
/* ------------------------------------------------------------------ */

/** Tồn khả dụng theo SKU, gộp mọi kho — dùng cho M02/M04/M05. */
export async function listStocksBySkus(skus) {
  if (!Array.isArray(skus) || skus.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from('inventory_stocks')
    .select('variant_id,on_hand,reserved,available,product_variants!inner(sku)')
    .in('product_variants.sku', skus);

  if (error) throw fromSupabaseError(error);
  return data ?? [];
}

export async function findVariantsBySkus(skus) {
  if (!Array.isArray(skus) || skus.length === 0) return [];

  return run(
    table('product_variants')
      .select(
        'id,sku,name,product_id,is_active,deleted_at,products!inner(id,name,status,price_regular,low_stock_threshold,deleted_at)',
      )
      .in('sku', skus)
      .is('deleted_at', null),
  );
}

/** Mọi dòng tồn của các SKU, kèm cờ kho mặc định để phân bổ giữ chỗ. */
export async function findStockOptions(skus) {
  if (!Array.isArray(skus) || skus.length === 0) return [];

  return run(
    table('inventory_stocks')
      .select(
        'variant_id,warehouse_id,on_hand,reserved,available,product_variants!inner(sku),warehouses!inner(name,is_default,is_active)',
      )
      .in('product_variants.sku', skus)
      .eq('warehouses.is_active', true),
  );
}

export async function findStockRowsByVariantIds(variantIds, warehouseId) {
  if (!Array.isArray(variantIds) || variantIds.length === 0) return [];

  return run(
    table('inventory_stocks')
      .select('variant_id,warehouse_id,on_hand,reserved,available')
      .in('variant_id', variantIds)
      .eq('warehouse_id', warehouseId),
  );
}

export async function listActiveReservations(orderRef) {
  return run(
    table('stock_reservations')
      .select('id,variant_id,warehouse_id,quantity,expires_at')
      .eq('order_ref', orderRef)
      .eq('status', 'ACTIVE'),
  );
}

export async function listStockLevels({ keyword, warehouseId, lowStockOnly, page, limit }) {
  return callRpc('inventory_stock_levels', {
    p_keyword: keyword || null,
    p_warehouse_id: warehouseId || null,
    p_low_stock_only: Boolean(lowStockOnly),
    p_page: page,
    p_limit: limit,
  });
}

export async function getInventorySummary() {
  return callRpc('inventory_summary');
}

/* ------------------------------------------------------------------ */
/* Warehouses (M08-F01)                                                */
/* ------------------------------------------------------------------ */

export async function listWarehouses({ includeInactive = false } = {}) {
  let query = table('warehouses')
    .select('id,code,name,address,phone,is_default,is_active,created_at,updated_at')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findWarehouseById(id) {
  return run(
    table('warehouses')
      .select('id,code,name,address,phone,is_default,is_active,created_at,updated_at')
      .eq('id', id)
      .maybeSingle(),
  );
}

export async function findWarehouseByCode(code, excludeId = null) {
  let query = table('warehouses').select('id,code').eq('code', code);
  if (excludeId) query = query.neq('id', excludeId);
  return run(query.maybeSingle());
}

export async function getDefaultWarehouse() {
  return run(
    table('warehouses')
      .select('id,code,name,is_default')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle(),
  );
}

export async function saveWarehouse({
  id = null,
  code,
  name,
  address,
  phone,
  isDefault,
  isActive,
}) {
  return callRpc('upsert_warehouse', {
    p_id: id,
    p_code: code,
    p_name: name,
    p_address: address ?? null,
    p_phone: phone ?? null,
    p_is_default: Boolean(isDefault),
    p_is_active: isActive !== false,
  });
}

/* ------------------------------------------------------------------ */
/* Suppliers (M08-F12)                                                 */
/* ------------------------------------------------------------------ */

export async function listSuppliers({ keyword = '', includeInactive = false } = {}) {
  let query = table('suppliers')
    .select(
      'id,code,name,contact_name,phone,email,address,tax_code,is_active,created_at,updated_at',
    )
    .order('name', { ascending: true });

  if (keyword) {
    const safeKeyword = String(keyword)
      .replace(/[,()%*\\]/g, ' ')
      .trim();
    if (safeKeyword) {
      query = query.or(`code.ilike.%${safeKeyword}%,name.ilike.%${safeKeyword}%`);
    }
  }
  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findSupplierById(id) {
  return run(table('suppliers').select('*').eq('id', id).maybeSingle());
}

export async function findSupplierByCode(code, excludeId = null) {
  let query = table('suppliers').select('id,code').eq('code', code);
  if (excludeId) query = query.neq('id', excludeId);
  return run(query.maybeSingle());
}

export async function insertSupplier(data) {
  return run(table('suppliers').insert(data).select().single());
}

export async function updateSupplierRow(id, patch) {
  return run(table('suppliers').update(patch).eq('id', id).select().maybeSingle());
}

/* ------------------------------------------------------------------ */
/* Goods receipts (M08-F02)                                            */
/* ------------------------------------------------------------------ */

export async function createGoodsReceiptRpc({ supplierId, warehouseId, items, note, createdBy }) {
  return callRpc('receive_goods', {
    p_supplier_id: supplierId ?? null,
    p_warehouse_id: warehouseId,
    p_items: items,
    p_note: note || null,
    p_created_by: createdBy ?? null,
  });
}

export async function listGoodsReceipts({ limit, offset, warehouseId, supplierId, status }) {
  let query = table('goods_receipts')
    .select(
      'id,code,status,note,total_amount,received_at,created_at,supplier:suppliers(name),warehouse:warehouses(name),creator:users!created_by(full_name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (warehouseId) query = query.eq('warehouse_id', warehouseId);
  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (status) query = query.eq('status', status);
  return runWithCount(query);
}

/* ------------------------------------------------------------------ */
/* Stock adjustments (M08-F09)                                         */
/* ------------------------------------------------------------------ */

export async function createStockAdjustmentRpc({
  warehouseId,
  reason,
  items,
  requiresAdminApproval,
  autoApprove,
  createdBy,
}) {
  return callRpc('create_stock_adjustment', {
    p_warehouse_id: warehouseId,
    p_reason: reason,
    p_items: items,
    p_requires_admin_approval: Boolean(requiresAdminApproval),
    p_auto_approve: Boolean(autoApprove),
    p_created_by: createdBy ?? null,
  });
}

export async function decideStockAdjustmentRpc({ adjustmentId, action, actorId }) {
  return callRpc('decide_stock_adjustment', {
    p_adjustment_id: adjustmentId,
    p_action: action,
    p_actor: actorId ?? null,
  });
}

export async function listStockAdjustments({ limit, offset, warehouseId, status }) {
  let query = table('stock_adjustments')
    .select(
      'id,code,reason,status,requires_admin_approval,created_at,approved_by,warehouse:warehouses(name),creator:users!created_by(full_name),approver:users!approved_by(full_name),stock_adjustment_items(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (warehouseId) query = query.eq('warehouse_id', warehouseId);
  if (status) query = query.eq('status', status);
  return runWithCount(query);
}

/* ------------------------------------------------------------------ */
/* Stock transfers (M08-F10)                                           */
/* ------------------------------------------------------------------ */

export async function createStockTransferRpc({
  fromWarehouseId,
  toWarehouseId,
  items,
  note,
  createdBy,
}) {
  return callRpc('create_stock_transfer', {
    p_from_warehouse_id: fromWarehouseId,
    p_to_warehouse_id: toWarehouseId,
    p_items: items,
    p_note: note || null,
    p_created_by: createdBy ?? null,
  });
}

export async function transitionStockTransferRpc({ transferId, action, actorId }) {
  return callRpc('transition_stock_transfer', {
    p_transfer_id: transferId,
    p_action: action,
    p_actor: actorId ?? null,
  });
}

export async function listStockTransfers({
  limit,
  offset,
  status,
  fromWarehouseId,
  toWarehouseId,
}) {
  let query = table('stock_transfers')
    .select(
      'id,code,status,note,shipped_at,received_at,created_at,from_warehouse:warehouses!from_warehouse_id(name),to_warehouse:warehouses!to_warehouse_id(name),stock_transfer_items(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (fromWarehouseId) query = query.eq('from_warehouse_id', fromWarehouseId);
  if (toWarehouseId) query = query.eq('to_warehouse_id', toWarehouseId);
  return runWithCount(query);
}

/* ------------------------------------------------------------------ */
/* Returned stock (M08-F08)                                            */
/* ------------------------------------------------------------------ */

export async function receiveReturnedStockRpc({ orderRef, warehouseId, items, note, createdBy }) {
  return callRpc('receive_returned_stock', {
    p_order_ref: orderRef,
    p_warehouse_id: warehouseId,
    p_items: items,
    p_note: note || null,
    p_created_by: createdBy ?? null,
  });
}

/* ------------------------------------------------------------------ */
/* Stock card (M08-F13)                                                */
/* ------------------------------------------------------------------ */

export async function getStockCardRpc({ sku, warehouseId, fromDate, toDate }) {
  return callRpc('stock_card', {
    p_sku: sku,
    p_warehouse_id: warehouseId,
    p_from: fromDate || null,
    p_to: toDate || null,
  });
}

/* ------------------------------------------------------------------ */
/* Reservations (M08-F05/F06/F07)                                      */
/* ------------------------------------------------------------------ */

export async function reserveStockRpc({ orderRef, items, expiresAt }) {
  return callRpc('reserve_stock', {
    p_order_ref: orderRef,
    p_items: items,
    p_expires_at: expiresAt || null,
  });
}

export async function releaseStockRpc(orderRef) {
  return callRpc('release_stock', { p_order_ref: orderRef });
}

export async function fulfillStockRpc(orderRef) {
  return callRpc('fulfill_stock', { p_order_ref: orderRef });
}

/* ------------------------------------------------------------------ */
/* Notifications (M08-F11)                                             */
/* ------------------------------------------------------------------ */

export async function insertLowStockNotification(payload) {
  return run(
    table('notifications')
      .insert({
        user_id: null,
        channel: 'IN_APP',
        template_key: 'inventory.low_stock',
        payload,
        status: 'PENDING',
      })
      .select('id')
      .single(),
  );
}
