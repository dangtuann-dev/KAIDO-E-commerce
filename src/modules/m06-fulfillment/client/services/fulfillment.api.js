/**
 * [TOY-M06] Client services — Đơn hàng và giao vận
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M06-01 — Tính phí vận chuyển
 * Phí theo khu vực/khối lượng/gói giao; đơn >= 500.000đ miễn phí (M06-F08).
 * POST /api/v1/shipping/calculate-fee · quyền: công khai hoặc đăng nhập
 */
export function calculateShippingFee({ body } = {}) {
  const endpoint = getApiEndpoint('API-M06-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M06-02 — Tạo vận đơn & bàn giao ĐVVC
 * Sinh tracking code, xuất kho thực tế bằng RPC fulfill_stock, chuyển đơn sang SHIPPING (M06-F09).
 * POST /api/v1/orders/[orderRef]/fulfillment · quyền: ADMIN, STAFF, WAREHOUSE_KEEPER
 */
export function createFulfillment({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-02');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-03 — Theo dõi vận chuyển (M06-F03).
 * GET /api/v1/orders/[orderRef]/tracking · quyền: chủ đơn hoặc nhân viên
 */
export function getOrderTracking({ orderRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M06-03');
  return api.get(resolveEndpointPath(endpoint.path, { orderRef }), { query });
}

/**
 * API-M06-04 — Webhook đơn vị vận chuyển (M06-F10).
 * POST /api/v1/shipping/webhook/carrier · quyền: công khai (HMAC)
 */
export function handleCarrierWebhook({ body } = {}) {
  const endpoint = getApiEndpoint('API-M06-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M06-05 — Hủy đơn hàng (M06)
 * Trùng đường dẫn với API-M05-05; dùng chung handler để tránh hai route xung đột (OPEN_DECISIONS #16).
 * POST /api/v1/orders/[orderRef]/cancel · quyền: chủ đơn hoặc nhân viên
 */
export function cancelOrderFromFulfillment({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-05');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-06 — Yêu cầu đổi trả
 * Đổi trả trong 7 ngày từ lúc nhận, tối thiểu 1 ảnh, đơn đã COMPLETED (BR-M06-05).
 * POST /api/v1/orders/[orderRef]/returns · quyền: chủ đơn hoặc ADMIN/STAFF
 */
export function createReturnRequest({ orderRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-06');
  return api.post(resolveEndpointPath(endpoint.path, { orderRef }), body);
}

/**
 * API-M06-07 — Duyệt yêu cầu đổi trả (M06-F12).
 * PUT /api/v1/admin/returns/[id]/approve · quyền: ADMIN, STAFF
 */
export function approveReturnRequest({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M06-08 — Danh sách yêu cầu đổi trả (Admin) (M06-F12).
 * GET /api/v1/admin/returns · quyền: ADMIN, STAFF
 */
export function listReturnRequests({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M06-08');
  return api.get(endpoint.path, { query });
}

/**
 * API-M06-09 — Danh sách vận đơn & thống kê giao hàng (Admin) (M06-F14).
 * GET /api/v1/admin/shipping/shipments · quyền: ADMIN, STAFF, WAREHOUSE_KEEPER
 */
export function listShipments({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M06-09');
  return api.get(endpoint.path, { query });
}

/**
 * API-M06-10 — Cập nhật trạng thái đổi trả (Admin) (M06-F11, F12).
 * PUT /api/v1/admin/returns/[id]/status · quyền: ADMIN, STAFF, WAREHOUSE_KEEPER
 */
export function updateReturnStatus({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M06-10');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M05-03 — Chi tiết đơn hàng (M06-F01, F03).
 * GET /api/v1/orders/[orderRef] · quyền: chủ đơn hoặc nhân viên
 */
export function getOrderDetail({ orderRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-03');
  return api.get(resolveEndpointPath(endpoint.path, { orderRef }), { query });
}

/**
 * API-M05-08 — Đơn hàng của tôi (M06-F01, F02).
 * GET /api/v1/orders/my · quyền: đăng nhập
 */
export function listMyOrders({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M05-08');
  return api.get(endpoint.path, { query });
}

/**
 * API-M05-07 — Cập nhật trạng thái đơn (Admin) (M06-F05, F06).
 * PUT /api/v1/admin/orders/[id]/status · quyền: ADMIN, STAFF
 */
export function updateOrderStatus({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M05-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}
