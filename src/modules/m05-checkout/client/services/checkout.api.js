/**
 * [TOY-M05] Client services — Đặt hàng và thanh toán
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M05-01 — Tóm tắt checkout
 * Tính tạm tính, phí ship, giảm giá, tổng tiền trước khi đặt (M05-F01, F03, F05).
 * POST /api/v1/orders/checkout-summary · quyền: đăng nhập
 * Input: { item_ids: [...], address_id, coupon_code }
 * Output: { subtotal, shipping_fee, discount, final_amount }
 * TODO(API-M05-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getCheckoutSummary({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M05-02 — Đặt hàng
 * Tạo đơn + giữ tồn kho nguyên tử bằng RPC reserve_stock (BR-M05-01, NFR-M05-01).
 * POST /api/v1/orders · quyền: đăng nhập
 * Input: { shipping_address, payment_method, shipping_method, note, items }
 * Output: { order_id, order_code, payment_url, status }
 * TODO(API-M05-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function placeOrder({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-02');
  return api.post(endpoint.path, body);
}

/**
 * API-M05-03 — Chi tiết đơn hàng
 * Chi tiết đơn + lịch sử trạng thái + thông tin thanh toán của chủ đơn.
 * GET /api/v1/orders/[orderRef] · quyền: đăng nhập
 * Input: order_code | order_id
 * Output: { order_details, tracking_history, payment_info }
 * TODO(API-M05-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getOrderDetail({ orderRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-03');
  return api.get(resolveEndpointPath(endpoint.path, { orderRef }), { query });
}

/**
 * API-M05-04 — VNPAY IPN
 * Webhook IPN: đọc raw body, kiểm tra HMAC-SHA512, idempotency, cập nhật giao dịch (M05-F07).
 * POST /api/v1/payments/vnpay/ipn · quyền: công khai
 * Input: Query/body theo chuẩn VNPAY
 * Output: { RspCode, Message }
 * TODO(API-M05-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function vnpayIpn({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M05-05 — Hủy đơn hàng
 * Khách hủy khi đơn PENDING/CONFIRMED; giải phóng tồn kho (BR-M05-04, BR-M06-02).
 * POST /api/v1/orders/[orderRef]/cancel · quyền: đăng nhập
 * Input: { reason }
 * Output: { success: true, new_status: 'CANCELLED' }
 * TODO(API-M05-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function cancelOrder({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M05-05');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M05-06 — Danh sách đơn (Admin)
 * Lọc đơn theo trạng thái, từ khóa, khoảng ngày (M05-F11, M06-F05).
 * GET /api/v1/admin/orders · quyền: vai trò ADMIN, STAFF
 * Input: page, status, search, from_date, to_date
 * Output: { total, items: [OrderSummary] }
 * TODO(API-M05-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listAdminOrders({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-06');
  return api.get(endpoint.path, { query });
}

/**
 * API-M05-07 — Cập nhật trạng thái đơn (Admin)
 * Chuyển trạng thái theo ORDER_TRANSITIONS; ghi order_status_history bất biến (M05-F11).
 * PUT /api/v1/admin/orders/[id]/status · quyền: vai trò ADMIN, STAFF
 * Input: { new_status, note }
 * Output: { order_id, status, updated_at }
 * TODO(API-M05-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function updateOrderStatus({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M05-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}
