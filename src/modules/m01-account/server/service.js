import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NotImplementedError } from '@/server/http/errors.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { signAccessToken, signRefreshToken } from '@/server/auth/jwt.js';
import {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
} from './repository.js';

const BCRYPT_ROUNDS = 12;

/**
 * M01-F01 — Tạo tài khoản CUSTOMER (BR-M01-01, BR-M01-03).
 */
export async function registerAccount({ email, password, full_name, phone }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await findUserByEmail(normalizedEmail)) {
    throw Object.assign(new Error('Email này đã được sử dụng.'), {
      status: 409,
      code: 'EMAIL_TAKEN',
      field: 'email',
    });
  }

  if (phone && (await findUserByPhone(phone))) {
    throw Object.assign(new Error('Số điện thoại này đã được sử dụng.'), {
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

  const { password_hash: _omit, ...safeUser } = user;
  return safeUser;
}

/**
 * M01-F02 — Đăng nhập bằng email hoặc số điện thoại.
 * Sau 5 lần sai, tài khoản bị khóa 15 phút (BR-M01-02).
 */
export async function login({ email, password }) {
  const identifier = String(email).trim();
  const user = identifier.includes('@')
    ? await findUserByEmail(identifier.toLowerCase())
    : await findUserByPhone(identifier.replace(/[\s.-]/g, '').replace(/^\+84/, '0'));

  const invalid = () =>
    Object.assign(new Error('Thông tin đăng nhập không đúng.'), {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    });

  if (!user) throw invalid();

  const now = Date.now();
  if (user.locked_until && new Date(user.locked_until).getTime() > now) {
    throw Object.assign(
      new Error(`Tài khoản đang bị tạm khóa. Vui lòng thử lại sau ${BUSINESS_RULES.AUTH.LOCKOUT_MINUTES} phút.`),
      { status: 423, code: 'ACCOUNT_LOCKED' },
    );
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash ?? '');

  if (!passwordOk) {
    const failed = (user.failed_login_count ?? 0) + 1;
    const shouldLock = failed >= BUSINESS_RULES.AUTH.MAX_LOGIN_ATTEMPTS;

    await updateUser(user.id, {
      failed_login_count: shouldLock ? 0 : failed,
      locked_until: shouldLock
        ? new Date(now + BUSINESS_RULES.AUTH.LOCKOUT_MINUTES * 60 * 1000).toISOString()
        : user.locked_until ?? null,
    });

    if (shouldLock) {
      throw Object.assign(
        new Error(`Nhập sai quá nhiều lần. Tài khoản bị tạm khóa ${BUSINESS_RULES.AUTH.LOCKOUT_MINUTES} phút.`),
        { status: 423, code: 'ACCOUNT_LOCKED' },
      );
    }
    throw invalid();
  }

  if (user.status !== 'ACTIVE') {
    throw Object.assign(new Error('Tài khoản đã bị vô hiệu hóa.'), {
      status: 403,
      code: 'ACCOUNT_DISABLED',
    });
  }

  await updateUser(user.id, {
    failed_login_count: 0,
    locked_until: null,
    last_login_at: new Date().toISOString(),
  });

  const { token: accessToken, expiresIn } = await signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const { token: refreshToken, expiresIn: refreshTtl } = await signRefreshToken({
    userId: user.id,
    role: user.role,
  });

  const { password_hash: _omit, ...safeUser } = user;
  return {
    access_token: accessToken,
    expires_in: expiresIn,
    user_info: safeUser,
    refresh_token: refreshToken,
    refresh_expires_in: refreshTtl,
  };
}

/**
 * M01-F03 — Trả hồ sơ của người dùng đang đăng nhập.
 */
export async function getProfile({ userId }) {
  const user = await findUserById(userId);
  if (!user) {
    throw Object.assign(new Error('Không tìm thấy người dùng.'), {
      status: 404,
      code: 'NOT_FOUND',
    });
  }
  const { password_hash: _omit, ...safeUser } = user;
  return safeUser;
}

/**
 * M01-F03 — Cập nhật họ tên, SĐT, ngày sinh của bé, avatar.
 * Chỉ ghi các trường được gửi lên; SĐT mới không được trùng tài khoản khác.
 */
export async function updateProfile({ userId, body }) {
  const user = await findUserById(userId);
  if (!user) {
    throw Object.assign(new Error('Không tìm thấy người dùng.'), {
      status: 404,
      code: 'NOT_FOUND',
    });
  }

  const patch = {};
  if (body.full_name !== undefined) patch.full_name = body.full_name.trim();
  if (body.child_birthdate !== undefined) patch.child_birthdate = body.child_birthdate;
  if (body.avatar_url !== undefined) patch.avatar_url = body.avatar_url;

  if (body.phone !== undefined && body.phone !== user.phone) {
    const owner = await findUserByPhone(body.phone);
    if (owner && owner.id !== userId) {
      throw Object.assign(new Error('Số điện thoại này đã được sử dụng.'), {
        status: 409,
        code: 'PHONE_TAKEN',
        field: 'phone',
      });
    }
    patch.phone = body.phone;
  }

  const updated = await updateUser(userId, patch);
  const { password_hash: _omit, ...safeUser } = updated;
  return safeUser;
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
