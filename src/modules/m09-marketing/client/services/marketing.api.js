/**
 * [TOY-M09] Client services — Nội dung và chiến dịch quảng bá
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/**
 * API-M09-01 — Banner theo vị trí
 * Banner đang hiệu lực, sắp theo display_order, tối đa 5 banner lớn (BR-M09-04).
 * GET /api/v1/content/banners · quyền: công khai
 * Input: ?position=home_main
 * Output: [{ id, title, image_url, target_url, display_order }]
 * TODO(API-M09-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getBanners({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-01');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-02 — Chiến dịch đang chạy
 * Chiến dịch trong khoảng thời gian hiệu lực (M09-F05, F07).
 * GET /api/v1/content/promotions/active · quyền: công khai
 * Input: Không
 * Output: [{ campaign_id, title, banner_url, start_date, end_date }]
 * TODO(API-M09-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getActivePromotions({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-02');
  return api.get(endpoint.path, { query });
}

/**
 * API-M09-03 — Xác thực coupon
 * Kiểm tra coupon cho M04/M05, dùng chung CouponService (M09-F08, NFR-M09-02).
 * POST /api/v1/promotions/verify-coupon · quyền: công khai hoặc đăng nhập
 * Input: { code, order_amount, customer_id, items }
 * Output: { is_valid, discount_amount, message }
 * TODO(API-M09-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function verifyCoupon({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-03');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-04 — Tạo banner (Admin)
 * Tạo banner; ảnh jpg/png/webp <= 2MB, có lịch hiển thị (M09-F01, F05).
 * POST /api/v1/admin/marketing/banners · quyền: vai trò ADMIN, MARKETING
 * Input: { title, image_url, target_url, position, start_time, end_time }
 * Output: { id, created_at, status }
 * TODO(API-M09-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createBanner({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-05 — Tạo coupon chiến dịch (Admin)
 * Tạo voucher thuộc chiến dịch; một CouponService dùng chung (M09-F04).
 * POST /api/v1/admin/marketing/coupons · quyền: vai trò ADMIN, MARKETING
 * Input: { code, type, value, min_order, usage_limit, start_time, end_time }
 * Output: { coupon_id, code, status }
 * TODO(API-M09-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createCoupon({ body } = {}) {
  const endpoint = getApiEndpoint('API-M09-05');
  return api.post(endpoint.path, body);
}

/**
 * API-M09-06 — Danh sách bài viết
 * Bài viết đã publish, phân trang, lọc danh mục (M09-F02).
 * GET /api/v1/content/articles · quyền: công khai
 * Input: ?category=news&page=1
 * Output: { total, articles: [{ id, title, slug, thumbnail, excerpt, published_at }] }
 * TODO(API-M09-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listArticles({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M09-06');
  return api.get(endpoint.path, { query });
}
