/**
 * [TOY-M06] Client services — Đơn hàng và giao vận
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M06-01 — Tính phí vận chuyển
 * Phí theo khu vực/khối lượng/gói giao; đơn >= 500.000đ miễn phí (M06-F08).
 * POST /api/v1/shipping/calculate-fee · quyền: công khai hoặc đăng nhập
 * Input: { address, weight, total_amount }
 * Output: { shipping_fee, estimated_delivery_days, carrier_options }
 * TODO(API-M06-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function calculateShippingFee({ body } = {}) {
  const endpoint = getApiEndpoint('API-M06-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M06-02 — Tạo vận đơn & bàn giao ĐVVC
 * Sinh tracking code, xuất kho thực tế bằng RPC fulfill_stock, chuyển đơn sang SHIPPING (M06-F09).
 * POST /api/v1/orders/[orderRef]/fulfillment · quyền: vai trò ADMIN, STAFF, WAREHOUSE_KEEPER
 * Input: { carrier_code, pickup_time }
 * Output: { tracking_code, label_url, status: 'SHIPPING' }
 * TODO(API-M06-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createFulfillment({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-02');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-03 — Theo dõi vận chuyển
 * Timeline vận chuyển từ shipment_events của chủ đơn (M06-F03).
 * GET /api/v1/orders/[orderRef]/tracking · quyền: đăng nhập
 * Input: order_code
 * Output: { tracking_code, carrier, current_status, timeline: [...] }
 * TODO(API-M06-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getOrderTracking({ orderRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M06-03');
  return api.get(resolveEndpointPath(endpoint.path, { orderRef }), { query });
}

/**
 * API-M06-04 — Webhook đơn vị vận chuyển
 * Webhook ĐVVC bảo vệ bằng HMAC; cập nhật SHIPPING/DELIVERED/FAILED (M06-F10).
 * POST /api/v1/shipping/webhook/carrier · quyền: công khai
 * Input: Raw body + chữ ký HMAC
 * Output: { success: true, processed: true }
 * TODO(API-M06-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function handleCarrierWebhook({ body } = {}) {
  const endpoint = getApiEndpoint('API-M06-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M06-05 — Hủy đơn hàng (M06)
 * Trùng đường dẫn với API-M05-05; dùng chung handler để tránh hai route xung đột (OPEN_DECISIONS #16).
 * POST /api/v1/orders/[orderRef]/cancel · quyền: đăng nhập
 * Input: { reason }
 * Output: { success: true, new_status: 'CANCELLED' }
 * TODO(API-M06-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function cancelOrderFromFulfillment({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-05');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-06 — Yêu cầu đổi trả
 * Đổi trả trong 7 ngày từ lúc nhận, tối thiểu 1 ảnh, đơn đã COMPLETED (BR-M06-05).
 * POST /api/v1/orders/[orderRef]/returns · quyền: đăng nhập
 * Input: { item_ids, reason, images, note }
 * Output: { return_request_id, status: 'PENDING_APPROVAL' }
 * TODO(API-M06-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createReturnRequest({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-06');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-07 — Duyệt yêu cầu đổi trả
 * Nhân viên duyệt/từ chối, tính refund_amount (M06-F12).
 * PUT /api/v1/admin/returns/[id]/approve · quyền: vai trò ADMIN, STAFF
 * Input: { action: 'APPROVE' | 'REJECT', note }
 * Output: { return_request_id, status, refund_amount }
 * TODO(API-M06-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function approveReturnRequest({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}
