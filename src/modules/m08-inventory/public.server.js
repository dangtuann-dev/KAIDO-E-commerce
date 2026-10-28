import 'server-only';
import { listStocksBySkus } from './server/repository.js';
import { fulfillStock, releaseStock, reserveStock } from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M08 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M08-F04 — Tồn khả dụng theo SKU, gộp mọi kho.
 * Trả `[]` khi chưa có bản ghi tồn kho (dữ liệu chưa được nhập).
 * @param {string[]} skus
 * @returns {Promise<Array<{ sku: string, on_hand: number, reserved: number, available: number }>>}
 */
export async function checkAvailability(skus) {
  const rows = await listStocksBySkus(skus);

  const totals = new Map();
  for (const row of rows) {
    const sku = row.product_variants?.sku;
    if (!sku) continue;
    const current = totals.get(sku) ?? { sku, on_hand: 0, reserved: 0, available: 0 };
    current.on_hand += Number(row.on_hand ?? 0);
    current.reserved += Number(row.reserved ?? 0);
    current.available += Number(row.available ?? 0);
    totals.set(sku, current);
  }

  return [...totals.values()];
}

/**
 * M08-F05 — Giữ tồn nguyên tử khi đặt hàng.
 * @param {string} orderRef
 * @param {Array<{ sku: string, quantity: number }>} items
 */
export async function reserveForOrder(orderRef, items) {
  return reserveStock({ order_ref: orderRef, items });
}

/**
 * M08-F07 — Giải phóng tồn khi hủy/timeout.
 * @param {string} orderRef
 */
export async function releaseForOrder(orderRef) {
  return releaseStock({ order_ref: orderRef });
}

/**
 * M08-F06 — Xuất kho khi tạo vận đơn.
 * @param {string} orderRef
 */
export async function fulfillForOrder(orderRef) {
  return fulfillStock({ order_ref: orderRef });
}
