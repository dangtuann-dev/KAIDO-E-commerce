/**
 * [TOY-M10] Client services — Hỗ trợ và đánh giá
 * Mỗi hàm ứng với một API-M10-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M10-01 — Danh sách đánh giá sản phẩm
 * GET /api/v1/products/[idOrSlug]/reviews · quyền: công khai
 */
export function listProductReviews({ idOrSlug, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-01');
  return api.get(resolveEndpointPath(endpoint.path, { idOrSlug }), { query });
}

/**
 * API-M10-02 — Gửi đánh giá (Verified Purchase)
 * POST /api/v1/products/[idOrSlug]/reviews · quyền: đăng nhập
 */
export function createReview({ idOrSlug, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-02');
  return api.post(resolveEndpointPath(endpoint.path, { idOrSlug }), body);
}

/**
 * API-M10-03 — Tạo ticket hỗ trợ
 * POST /api/v1/support/tickets · quyền: đăng nhập
 */
export function createSupportTicket({ body } = {}) {
  const endpoint = getApiEndpoint('API-M10-03');
  return api.post(endpoint.path, body);
}

/**
 * API-M10-04 — Chi tiết ticket của tôi
 * GET /api/v1/support/tickets/[ticketRef] · quyền: đăng nhập
 */
export function getSupportTicket({ ticketRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-04');
  return api.get(resolveEndpointPath(endpoint.path, { ticketRef }), { query });
}

/**
 * API-M10-05 — Khách phản hồi ticket
 * POST /api/v1/support/tickets/[ticketRef]/reply · quyền: đăng nhập
 */
export function replySupportTicket({ ticketRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-05');
  return api.post(resolveEndpointPath(endpoint.path, { ticketRef }), body);
}

/**
 * API-M10-06 — Câu hỏi thường gặp
 * GET /api/v1/support/faqs · quyền: công khai
 */
export function listFaqs({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-06');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-07 — Kiểm duyệt đánh giá (Admin)
 * PUT /api/v1/admin/reviews/[id]/moderate · quyền: ADMIN, STAFF
 */
export function moderateReview({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M10-08 — Sửa đánh giá của tôi
 * PUT /api/v1/reviews/[id] · quyền: đăng nhập
 */
export function updateReview({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-08');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M10-09 — Xóa đánh giá của tôi
 * DELETE /api/v1/reviews/[id] · quyền: đăng nhập
 */
export function deleteReview({ id } = {}) {
  const endpoint = getApiEndpoint('API-M10-09');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}

/**
 * API-M10-10 — Đánh giá của tôi
 * GET /api/v1/reviews/my · quyền: đăng nhập
 */
export function listMyReviews({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-10');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-11 — Cửa hàng phản hồi đánh giá (Admin)
 * POST /api/v1/admin/reviews/[id]/reply · quyền: ADMIN, STAFF
 */
export function replyToReview({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-11');
  return api.post(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M10-12 — Danh sách đánh giá (Admin)
 * GET /api/v1/admin/reviews · quyền: ADMIN, STAFF
 */
export function listAdminReviews({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-12');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-13 — Danh sách ticket của tôi
 * GET /api/v1/support/tickets · quyền: đăng nhập
 */
export function listMySupportTickets({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-13');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-14 — Hàng đợi ticket (Admin)
 * GET /api/v1/admin/support/tickets · quyền: ADMIN, STAFF
 */
export function listAdminSupportTickets({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-14');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-15 — Chi tiết ticket (Admin)
 * GET /api/v1/admin/support/tickets/[id] · quyền: ADMIN, STAFF
 */
export function getAdminSupportTicket({ id } = {}) {
  const endpoint = getApiEndpoint('API-M10-15');
  return api.get(resolveEndpointPath(endpoint.path, { id }));
}

/**
 * API-M10-16 — Xử lý ticket (Admin)
 * PUT /api/v1/admin/support/tickets/[id] · quyền: ADMIN, STAFF
 */
export function processSupportTicket({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-16');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M10-17 — Dashboard CSKH
 * GET /api/v1/admin/support/dashboard · quyền: ADMIN, STAFF
 */
export function getSupportDashboard() {
  const endpoint = getApiEndpoint('API-M10-17');
  return api.get(endpoint.path);
}

/**
 * API-M10-18 — Danh sách FAQ (Admin)
 * GET /api/v1/admin/support/faqs · quyền: ADMIN, STAFF
 */
export function listAdminFaqs({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-18');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-19 — Tạo FAQ (Admin)
 * POST /api/v1/admin/support/faqs · quyền: ADMIN, STAFF
 */
export function createFaq({ body } = {}) {
  const endpoint = getApiEndpoint('API-M10-19');
  return api.post(endpoint.path, body);
}

/**
 * API-M10-20 — Sửa FAQ (Admin)
 * PUT /api/v1/admin/support/faqs/[id] · quyền: ADMIN, STAFF
 */
export function updateFaq({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-20');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M10-21 — Ẩn FAQ (Admin)
 * DELETE /api/v1/admin/support/faqs/[id] · quyền: ADMIN, STAFF
 */
export function deleteFaq({ id } = {}) {
  const endpoint = getApiEndpoint('API-M10-21');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}

/**
 * API-M10-22 — Nhóm FAQ (Admin)
 * GET /api/v1/admin/support/faq-categories · quyền: ADMIN, STAFF
 */
export function listFaqCategories({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-22');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-23 — Tạo nhóm FAQ (Admin)
 * POST /api/v1/admin/support/faq-categories · quyền: ADMIN, STAFF
 */
export function createFaqCategory({ body } = {}) {
  const endpoint = getApiEndpoint('API-M10-23');
  return api.post(endpoint.path, body);
}
