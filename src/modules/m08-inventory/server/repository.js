import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError, NotImplementedError } from '@/server/http/errors.js';

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

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M08-F01) — bảng `warehouses`.
 */
export async function listWarehouses() {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F01) — bảng `warehouses`.
 */
export async function findDefaultWarehouse() {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F01) — bảng `warehouses`.
 */
export async function createWarehouse(_data) {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F01) — bảng `warehouses`.
 */
export async function updateWarehouse(_id, _patch) {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F12) — bảng `suppliers`.
 */
export async function listSuppliers() {
  throw new NotImplementedError('M08-F12');
}

/**
 * TODO(M08-F12) — bảng `suppliers`.
 */
export async function createSupplier(_data) {
  throw new NotImplementedError('M08-F12');
}

/**
 * TODO(M08-F12) — bảng `suppliers`.
 */
export async function updateSupplier(_id, _patch) {
  throw new NotImplementedError('M08-F12');
}

/**
 * TODO(M08-F03) — bảng `inventory_stocks`.
 */
export async function findStockBySku(_sku, _warehouseId) {
  throw new NotImplementedError('M08-F03');
}

/**
 * M08-F04 — bảng `inventory_stocks`, gộp tồn khả dụng theo SKU trên mọi kho.
 */
export async function listStocksBySkus(skus) {
  if (!Array.isArray(skus) || skus.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from('inventory_stocks')
    .select('variant_id,on_hand,reserved,available,product_variants!inner(sku)')
    .in('product_variants.sku', skus);

  if (error) throw fromSupabaseError(error);
  return data ?? [];
}

/**
 * TODO(M08-F02) — bảng `goods_receipts`.
 */
export async function createGoodsReceipt(_data) {
  throw new NotImplementedError('M08-F02');
}

/**
 * TODO(M08-F02) — bảng `goods_receipt_items`.
 */
export async function createGoodsReceiptItems(_receiptId, _items) {
  throw new NotImplementedError('M08-F02');
}

/**
 * TODO(M08-F09) — bảng `stock_adjustments`.
 */
export async function createStockAdjustment(_data) {
  throw new NotImplementedError('M08-F09');
}

/**
 * TODO(M08-F09) — bảng `stock_adjustment_items`.
 */
export async function createStockAdjustmentItems(_adjustmentId, _items) {
  throw new NotImplementedError('M08-F09');
}

/**
 * TODO(M08-F09) — bảng `stock_adjustments`.
 */
export async function updateStockAdjustmentStatus(_id, _status) {
  throw new NotImplementedError('M08-F09');
}

/**
 * TODO(M08-F13) — bảng `stock_movement_logs`.
 */
export async function appendStockMovementLog(_data) {
  throw new NotImplementedError('M08-F13');
}

/**
 * TODO(M08-F13) — bảng `stock_movement_logs`.
 */
export async function listStockMovementLogs(_filters) {
  throw new NotImplementedError('M08-F13');
}
