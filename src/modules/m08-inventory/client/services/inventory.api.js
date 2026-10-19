/**
 * [TOY-M08] Client services — Kho và tồn kho
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/**
 * API-M08-01 — Kiểm tra tồn kho
 * Trả available = on_hand - reserved theo SKU cho giỏ hàng/PDP (M08-F04).
 * GET /api/v1/inventory/stock-check · quyền: công khai
 * Input: ?skus=SKU1,SKU2
 * Output: { items: [{ sku, available, in_stock }] }
 * TODO(API-M08-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function checkStock({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-01');
  return api.get(endpoint.path, { query });
}

/**
 * API-M08-02 — Giữ tồn kho
 * Nội bộ: gọi RPC reserve_stock(order_ref, items) trong một giao dịch (M08-F05).
 * POST /api/v1/inventory/reserve · quyền: vai trò ADMIN, STAFF, WAREHOUSE_KEEPER
 * Input: { order_ref, items: [{ sku, quantity }] }
 * Output: { success: true, reservation_id, expires_at }
 * TODO(API-M08-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function reserveStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-02');
  return api.post(endpoint.path, body);
}

/**
 * API-M08-03 — Giải phóng tồn kho
 * Nội bộ: gọi RPC release_stock khi hủy đơn/timeout (M08-F07).
 * POST /api/v1/inventory/release · quyền: vai trò ADMIN, STAFF, WAREHOUSE_KEEPER
 * Input: { order_ref, reservation_id }
 * Output: { success: true, released_items: [...] }
 * TODO(API-M08-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function releaseStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-03');
  return api.post(endpoint.path, body);
}

/**
 * API-M08-04 — Xuất kho thực tế
 * Nội bộ: gọi RPC fulfill_stock khi tạo vận đơn (M08-F06, BR-M06-04).
 * POST /api/v1/inventory/fulfill · quyền: vai trò ADMIN, STAFF, WAREHOUSE_KEEPER
 * Input: { order_ref, reservation_id }
 * Output: { success: true, export_note_id }
 * TODO(API-M08-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function fulfillStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M08-05 — Tạo phiếu nhập kho (Admin)
 * Lập phiếu nhập NCC, tăng on_hand, ghi stock_movement_logs (M08-F02).
 * POST /api/v1/admin/inventory/goods-receipt · quyền: vai trò ADMIN, WAREHOUSE_KEEPER
 * Input: { supplier_id, warehouse_id, items: [...] }
 * Output: { receipt_id, total_quantity, total_cost }
 * TODO(API-M08-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createGoodsReceipt({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-05');
  return api.post(endpoint.path, body);
}

/**
 * API-M08-06 — Tạo phiếu điều chỉnh kiểm kê (Admin)
 * Lệch > 5.000.000đ hoặc > 10 sản phẩm cần Admin duyệt (M08-F09).
 * POST /api/v1/admin/inventory/adjustments · quyền: vai trò ADMIN, WAREHOUSE_KEEPER
 * Input: { warehouse_id, items: [{ sku, diff_quantity, reason }] }
 * Output: { adjustment_id, status: 'PENDING_APPROVAL' | 'APPROVED' }
 * TODO(API-M08-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createStockAdjustment({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-06');
  return api.post(endpoint.path, body);
}

/**
 * API-M08-07 — Thẻ kho (Admin)
 * Nhật ký biến động bất biến, tồn đầu kỳ/cuối kỳ (M08-F13).
 * GET /api/v1/admin/inventory/stock-card · quyền: vai trò ADMIN, WAREHOUSE_KEEPER
 * Input: { sku, warehouse_id, from_date, to_date }
 * Output: { sku, opening_stock, closing_stock, movements: [...] }
 * TODO(API-M08-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getStockCard({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-07');
  return api.get(endpoint.path, { query });
}
