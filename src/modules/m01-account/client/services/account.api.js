/**
 * [TOY-M01] Client services — Tài khoản và người dùng
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/**
 * API-M01-01 — Đăng ký tài khoản
 * Tạo tài khoản bằng email/SĐT; email và SĐT duy nhất (BR-M01-01).
 * POST /api/v1/auth/register · quyền: công khai
 * Input: { email, password, full_name, phone }
 * Output: { user_id, email, access_token }
 * TODO(API-M01-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function registerAccount({ body } = {}) {
  const endpoint = getApiEndpoint('API-M01-01');
  return api.post(endpoint.path, body);
}

/**
 * API-M01-02 — Đăng nhập
 * Đăng nhập email/SĐT + mật khẩu, cấp access token 15 phút và refresh token cookie 7 ngày (M01-F02).
 * POST /api/v1/auth/login · quyền: công khai
 * Input: { email, password }
 * Output: { access_token, user_info, expires_in } + Set-Cookie refresh_token
 * TODO(API-M01-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function login({ body } = {}) {
  const endpoint = getApiEndpoint('API-M01-02');
  return api.post(endpoint.path, body);
}

/**
 * API-M01-03 — Xem hồ sơ cá nhân
 * Lấy thông tin hồ sơ của người dùng đang đăng nhập (M01-F03).
 * GET /api/v1/user/profile · quyền: đăng nhập
 * Input: Header Authorization: Bearer <access_token>
 * Output: { id, email, full_name, phone, child_birthdate, avatar_url }
 * TODO(API-M01-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getProfile({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M01-03');
  return api.get(endpoint.path, { query });
}

/**
 * API-M01-04 — Cập nhật hồ sơ cá nhân
 * Cập nhật họ tên, SĐT, ngày sinh của bé, avatar (M01-F03).
 * PUT /api/v1/user/profile · quyền: đăng nhập
 * Input: { full_name, phone, child_birthdate, avatar_url? }
 * Output: { success: true, updated_at }
 * TODO(API-M01-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function updateProfile({ body } = {}) {
  const endpoint = getApiEndpoint('API-M01-04');
  return api.put(endpoint.path, body);
}

/**
 * API-M01-05 — Danh sách địa chỉ
 * Sổ địa chỉ tối đa 10 địa chỉ, đúng 1 địa chỉ mặc định (M01-F04, BR-M01-04).
 * GET /api/v1/user/addresses · quyền: đăng nhập
 * Input: Header Bearer Token
 * Output: [{ id, recipient_name, phone, address, is_default }]
 * TODO(API-M01-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listAddresses({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M01-05');
  return api.get(endpoint.path, { query });
}

/**
 * API-M01-06 — Quên mật khẩu
 * Gửi OTP qua email/SMS; hiệu lực 5 phút, tối đa 3 lần/giờ (M01-F05).
 * POST /api/v1/auth/forgot-password · quyền: công khai
 * Input: { email }
 * Output: { message: 'OTP_SENT', expired_in: 300 }
 * TODO(API-M01-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function forgotPassword({ body } = {}) {
  const endpoint = getApiEndpoint('API-M01-06');
  return api.post(endpoint.path, body);
}

/**
 * API-M01-07 — Danh sách người dùng (Admin)
 * Danh sách tài khoản, lọc theo vai trò, khóa/mở khóa (M01-F07).
 * GET /api/v1/admin/users · quyền: vai trò ADMIN
 * Input: ?page=1&role=customer
 * Output: { total, users: [UserInfo] }
 * TODO(API-M01-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listAdminUsers({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M01-07');
  return api.get(endpoint.path, { query });
}

/**
 * API-M01-12 — Đổi mật khẩu
 * PUT /api/v1/user/password · quyền: đăng nhập
 */
export function changePassword({ body } = {}) {
  const endpoint = getApiEndpoint('API-M01-12');
  return api.put(endpoint.path, body);
}