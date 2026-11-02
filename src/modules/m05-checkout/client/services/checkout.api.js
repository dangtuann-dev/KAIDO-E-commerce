/**
 * [TOY-M05] Client services — Đặt hàng và thanh toán
 * Mỗi hàm ứng với một API-M05-xx trong registry; path đọc từ src/shared/api-endpoints.js.
 * Không có hàm nào thu thập thông tin thẻ (SYS-NFR-04).
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M05-01 — Tóm tắt checkout
 * Tính tạm tính, phí ship, giảm giá, tổng tiền trước khi đặt (M05-F01, F03, F05).
 * POST /api/v1/orders/checkout-summary · quyền: đăng nhập
 * @param {{ body: {
 *   item_ids: string[],
 *   address_id?: string,
 *   shipping_address?: object,
 *   shipping_method?: string,
 *   coupon_code?: string,
 *   points_redeemed?: number,
 * } }} input
 */
export function getCheckoutSummary({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M05-02 — Đặt hàng
 * Tạo đơn + giữ tồn kho nguyên tử bằng RPC reserve_stock (BR-M05-01, NFR-M05-01).
 * POST /api/v1/orders · quyền: đăng nhập
 * @param {{ body: {
 *   shipping_address: object,
 *   payment_method: string,
 *   shipping_method: string,
 *   note?: string,
 *   items: { product_id: string, variant_id?: string|null, quantity: number }[],
 *   coupon_code?: string,
 *   points_redeemed?: number,
 * } }} input
 */
export function placeOrder({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-02');
  return api.post(endpoint.path, body);
}

/**
 * API-M05-03 — Chi tiết đơn hàng
 * Chi tiết đơn + lịch sử trạng thái + thông tin thanh toán của chủ đơn (M05-F10, F08).
 * GET /api/v1/orders/[orderRef] · quyền: đăng nhập
 * @param {{ orderRef: string, query?: Record<string, unknown> }} input
 */
export function getOrderDetail({ orderRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-03');
  return api.get(resolveEndpointPath(endpoint.path, { orderRef }), { query });
}

/**
 * API-M05-04 — VNPAY IPN
 * Chỉ dùng cho trang mô phỏng thanh toán ở môi trường phát triển:
 * gửi lại đúng bộ tham số đã ký để chạy trọn luồng IPN → order paid.
 * POST /api/v1/payments/vnpay/ipn · quyền: công khai
 * @param {{ body: Record<string, string> }} input
 */
export function vnpayIpn({ body } = {}) {
  const endpoint = getApiEndpoint('API-M05-04');
  return api.post(endpoint.path, body, { auth: false });
}

/**
 * API-M05-05 — Hủy đơn hàng
 * Khách hủy khi đơn chưa đóng gói; hệ thống giải phóng tồn kho (BR-M05-04, BR-M06-02).
 * POST /api/v1/orders/[orderRef]/cancel · quyền: đăng nhập
 * @param {{ orderRef: string, body: { reason: string } }} input
 */
export function cancelOrder({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M05-05');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M05-06 — Danh sách đơn (Admin)
 * Lọc đơn theo trạng thái, từ khóa, khoảng ngày (M05-F11, M06-F05).
 * GET /api/v1/admin/orders · quyền: vai trò ADMIN, STAFF
 * @param {{ query?: Record<string, unknown> }} input
 */
export function listAdminOrders({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-06');
  return api.get(endpoint.path, { query });
}

/**
 * API-M05-07 — Cập nhật trạng thái đơn (Admin)
 * Chuyển trạng thái theo ORDER_TRANSITIONS; ghi order_status_history bất biến (M05-F11).
 * PUT /api/v1/admin/orders/[id]/status · quyền: vai trò ADMIN, STAFF
 * @param {{ id: string, body: { new_status: string, note?: string } }} input
 */
export function updateOrderStatus({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M05-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}
