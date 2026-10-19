/**
 * [TOY-M07] Client services — Khuyến mãi và khách thân thiết
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/**
 * API-M07-01 — Kiểm tra voucher
 * Kiểm tra hiệu lực và tính giảm giá; gọi CouponService của M09 (M07-F02).
 * POST /api/v1/loyalty/validate-voucher · quyền: công khai hoặc đăng nhập
 * Input: { code, order_subtotal, customer_id }
 * Output: { is_valid, discount_amount, message }
 * TODO(API-M07-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function validateVoucher({ body } = {}) {
  const endpoint = getApiEndpoint('API-M07-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M07-02 — Điểm thưởng của tôi
 * Số điểm hiện có, hạng thành viên, điểm sắp hết hạn (M07-F03..F06).
 * GET /api/v1/loyalty/my-points · quyền: đăng nhập
 * Input: Header Bearer Token
 * Output: { total_points, current_tier, points_expiring, value_vnd }
 * TODO(API-M07-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getMyPoints({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M07-02');
  return api.get(endpoint.path, { query });
}

/**
 * API-M07-03 — Lịch sử điểm thưởng
 * Nhật ký cộng/trừ điểm, lý do, ngày hết hạn (M07-F07).
 * GET /api/v1/loyalty/point-history · quyền: đăng nhập
 * Input: ?page=1&limit=20
 * Output: { total, history: [{ id, change, reason, created_at }] }
 * TODO(API-M07-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getPointHistory({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M07-03');
  return api.get(endpoint.path, { query });
}

/**
 * API-M07-04 — Tính giảm giá điểm + voucher
 * Tiêu điểm tối đa 50% hóa đơn, bội số 10 điểm; kết hợp voucher đúng giới hạn (M07-F04).
 * POST /api/v1/loyalty/calculate-discount · quyền: đăng nhập
 * Input: { points_redeemed, voucher_code, subtotal }
 * Output: { total_discount, final_subtotal }
 * TODO(API-M07-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function calculateLoyaltyDiscount({ body } = {}) {
  const endpoint = getApiEndpoint('API-M07-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M07-05 — Tạo voucher (Admin)
 * Tạo voucher; dùng chung CouponService với M09 (OPEN_DECISIONS #9).
 * POST /api/v1/admin/loyalty/vouchers · quyền: vai trò ADMIN, MARKETING
 * Input: { code, type, value, max_discount, min_order, usage_limit }
 * Output: { voucher_id, code, status }
 * TODO(API-M07-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createVoucher({ body } = {}) {
  const endpoint = getApiEndpoint('API-M07-05');
  return api.post(endpoint.path, body);
}

/**
 * API-M07-06 — Thống kê hạng thành viên (Admin)
 * Số thành viên theo hạng và ngưỡng chi tiêu (M07-F05).
 * GET /api/v1/admin/loyalty/tiers-summary · quyền: vai trò ADMIN, MARKETING
 * Input: Không
 * Output: [{ tier: 'GOLD', member_count: 1420, min_spent: 5000000 }]
 * TODO(API-M07-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getTierSummary({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M07-06');
  return api.get(endpoint.path, { query });
}
