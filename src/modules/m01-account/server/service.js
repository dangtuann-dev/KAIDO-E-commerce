import 'server-only';
import bcrypt from 'bcryptjs';
import { NotImplementedError } from '@/server/http/errors.js';
import { findUserByEmail, findUserByPhone, createUser } from './repository.js';

const BCRYPT_ROUNDS = 12;

/**
 * TODO(M01-F01) — Tạo tài khoản CUSTOMER, hash Bcrypt, kiểm tra email/SĐT duy nhất (BR-M01-01, BR-M01-03).
 */
export async function registerAccount({ email, password, full_name, phone }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await findUserByEmail(normalizedEmail)) {
    throw Object.assign(new Error('EMAIL_TAKEN'), {
      status: 409,
      code: 'EMAIL_TAKEN',
      field: 'email',
    });
  }

  if (phone && (await findUserByPhone(phone))) {
    throw Object.assign(new Error('PHONE_TAKEN'), {
      status: 409,
      code: 'PHONE_TAKEN',
      field: 'phone',
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await createUser({
    email: normalizedEmail,
    phone: phone || null,
    full_name: full_name.trim(),
    password_hash: passwordHash,
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });

  // Không bao giờ trả password_hash ra ngoài
  const { password_hash: _omit, ...safeUser } = user;
  return safeUser;
 } 

/**
 * TODO(M01-F02) — Xác thực mật khẩu, đếm số lần sai và khóa 15 phút sau 5 lần (BR-M01-02).
 */
export async function login() {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F02) — Thu hồi refresh token hiện tại và xóa cookie HttpOnly.
 */
export async function logout() {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F03) — Trả hồ sơ của người dùng đang đăng nhập.
 */
export async function getProfile() {
  throw new NotImplementedError('M01-F03');
}

/**
 * TODO(M01-F03) — Cập nhật họ tên, SĐT, ngày sinh của bé, avatar.
 */
export async function updateProfile() {
  throw new NotImplementedError('M01-F03');
}

/**
 * TODO(M01-F03) — Đổi mật khẩu sau khi xác minh mật khẩu hiện tại.
 */
export async function changePassword() {
  throw new NotImplementedError('M01-F03');
}

/**
 * TODO(M01-F04) — Liệt kê tối đa 10 địa chỉ, đúng một địa chỉ mặc định (BR-M01-04).
 */
export async function listAddresses() {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — Thêm địa chỉ mới.
 */
export async function createAddress() {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — Sửa địa chỉ thuộc chủ tài khoản.
 */
export async function updateAddress() {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — Xóa mềm và tự chuyển địa chỉ mặc định nếu cần (BR-M01-04).
 */
export async function deleteAddress() {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — Đặt duy nhất một địa chỉ mặc định trong cùng transaction.
 */
export async function setDefaultAddress() {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F05) — Sinh OTP 5 phút, giới hạn 3 lần gửi/giờ, gửi qua integration mail/SMS.
 */
export async function requestPasswordReset() {
  throw new NotImplementedError('M01-F05');
}

/**
 * TODO(M01-F05) — Xác minh OTP còn hiệu lực và chưa dùng.
 */
export async function verifyPasswordResetOtp() {
  throw new NotImplementedError('M01-F05');
}

/**
 * TODO(M01-F05) — Đặt mật khẩu mới và thu hồi toàn bộ refresh token cũ.
 */
export async function resetPassword() {
  throw new NotImplementedError('M01-F05');
}

/**
 * TODO(M01-F06) — Ủy quyền cho M05/M06 lấy danh sách đơn của người dùng; M01 không đọc bảng orders.
 */
export async function getPurchaseHistory() {
  throw new NotImplementedError('M01-F06');
}

/**
 * TODO(M01-F07) — Danh sách người dùng có lọc vai trò/trạng thái (BR-M01-05).
 */
export async function listAdminUsers() {
  throw new NotImplementedError('M01-F07');
}

/**
 * TODO(M01-F07) — Đổi vai trò theo RBAC; chỉ ADMIN.
 */
export async function updateUserRole() {
  throw new NotImplementedError('M01-F07');
}

/**
 * TODO(M01-F07) — Khóa/mở khóa tài khoản vi phạm; chỉ ADMIN.
 */
export async function updateUserStatus() {
  throw new NotImplementedError('M01-F07');
}
