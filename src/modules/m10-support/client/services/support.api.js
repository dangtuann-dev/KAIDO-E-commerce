/**
 * [TOY-M10] Client services — Hỗ trợ và đánh giá
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M10-01 — Danh sách đánh giá sản phẩm
 * Điểm trung bình, phân bố sao, đánh giá đã duyệt, 10 đánh giá/trang (M10-F03).
 * GET /api/v1/products/[idOrSlug]/reviews · quyền: công khai
 * Input: ?page=1&stars=5
 * Output: { rating_avg, rating_breakdown, total, reviews: [...] }
 * TODO(API-M10-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listProductReviews({ idOrSlug, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-01');
  return api.get(resolveEndpointPath(endpoint.path, { idOrSlug }), { query });
}

/**
 * API-M10-02 — Gửi đánh giá
 * Chỉ khách đã mua với đơn COMPLETED (Verified Purchase), rating 1–5, nội dung 10–1000 ký tự.
 * POST /api/v1/products/[idOrSlug]/reviews · quyền: đăng nhập
 * Input: { order_id, rating, comment, images }
 * Output: { review_id, status: 'APPROVED', created_at }
 * TODO(API-M10-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createReview({ idOrSlug, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-02');
  return api.post(resolveEndpointPath(endpoint.path, { idOrSlug }), body);
}

/**
 * API-M10-03 — Tạo ticket hỗ trợ
 * Tạo ticket mã #TK-XXXXX, đính kèm tối đa 5 ảnh hoặc 1 video (M10-F06).
 * POST /api/v1/support/tickets · quyền: đăng nhập
 * Input: { category, subject, message, order_id, files }
 * Output: { ticket_id, ticket_code, status: 'OPEN' }
 * TODO(API-M10-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createSupportTicket({ body } = {}) {
  const endpoint = getApiEndpoint('API-M10-03');
  return api.post(endpoint.path, body);
}

/**
 * API-M10-04 — Chi tiết ticket
 * Chỉ chủ ticket xem được hội thoại của mình (NFR-M10-02).
 * GET /api/v1/support/tickets/[ticketRef] · quyền: đăng nhập
 * Input: ticket_code | ticket_id
 * Output: { ticket_details, conversation_messages: [...] }
 * TODO(API-M10-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getSupportTicket({ ticketRef, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-04');
  return api.get(resolveEndpointPath(endpoint.path, { ticketRef }), { query });
}

/**
 * API-M10-05 — Phản hồi ticket
 * Khách bổ sung tin nhắn/đính kèm; tự mở lại ticket nếu đã RESOLVED (M10-F07).
 * POST /api/v1/support/tickets/[ticketRef]/reply · quyền: đăng nhập
 * Input: { message, files }
 * Output: { message_id, sender_type, sent_at }
 * TODO(API-M10-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function replySupportTicket({ ticketRef, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-05');
  return api.post(resolveEndpointPath(endpoint.path, { ticketRef }), body);
}

/**
 * API-M10-06 — Câu hỏi thường gặp
 * FAQ nhóm theo chủ đề, tìm kiếm từ khóa (M10-F09, F10).
 * GET /api/v1/support/faqs · quyền: công khai
 * Input: ?keyword=doi tra
 * Output: [{ category, questions: [{ q, a }] }]
 * TODO(API-M10-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listFaqs({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M10-06');
  return api.get(endpoint.path, { query });
}

/**
 * API-M10-07 — Kiểm duyệt đánh giá (Admin)
 * Duyệt/từ chối/ẩn đánh giá; đồng bộ rating_avg sang M02 (M10-F04, BR-M10-03).
 * PUT /api/v1/admin/reviews/[id]/moderate · quyền: vai trò ADMIN, STAFF
 * Input: { action: 'APPROVE' | 'REJECT' | 'HIDE', reason }
 * Output: { review_id, status }
 * TODO(API-M10-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function moderateReview({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M10-07');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}
