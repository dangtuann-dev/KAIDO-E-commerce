import bcrypt from 'bcryptjs';
import { AppError, NotImplementedError } from '@/server/http/errors.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/server/auth/jwt.js';
import {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
} from './repository.js';
import 'server-only';
import { z } from 'zod';
import {
  listAddressesByUser,
  findAddressForUser,
  insertAddress,
  patchAddress,
} from './repository.js';

const BCRYPT_ROUNDS = 12;
const MAX_ADDRESSES = 10;

const addressSchema = z.object({
  recipient_name: z.string().trim().min(2, 'Tên người nhận tối thiểu 2 ký tự.').max(50),
  phone: z.string().regex(/^0[35789]\d{8}$/, 'Số điện thoại không hợp lệ.'),
  province_name: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố.'),
  district_name: z.string().trim().nullable().optional(),
  ward_name: z.string().trim().min(1, 'Vui lòng nhập phường/xã.'),
  street_address: z.string().trim().min(5, 'Địa chỉ tối thiểu 5 ký tự.').max(255),
  is_default: z.boolean().optional(),
});

function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

function normalizePhone(raw) {
  const s = String(raw ?? '').replace(/[\s.-]/g, '');
  return s.startsWith('+84') ? `0${s.slice(3)}` : s;
}

function parseAddressInput(body) {
  const result = addressSchema.safeParse({ ...body, phone: normalizePhone(body?.phone) });
  if (!result.success) {
    const first = result.error.issues[0];
    throw fail(
      422,
      'VALIDATION_ERROR',
      first.message,
      result.error.issues.map((i) => ({ field: i.path[0], message: i.message })),
    );
  }
  return result.data;
}

// Tạm thời: mã tỉnh/phường lấy từ tên, cho đến khi chốt nguồn dữ liệu ĐVVC (OPEN_DECISIONS #12)
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toRow(input) {
  return {
    recipient_name: input.recipient_name,
    phone: input.phone,
    province_code: slugify(input.province_name),
    province_name: input.province_name,
    district_code: input.district_name ? slugify(input.district_name) : null,
    district_name: input.district_name || null,
    ward_code: slugify(input.ward_name),
    ward_name: input.ward_name,
    street_address: input.street_address,
  };
}

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  new_password: z
    .string()
    .min(8, 'Mật khẩu mới tối thiểu 8 ký tự.')
    .regex(/[A-Z]/, 'Mật khẩu mới cần ít nhất một chữ hoa.')
    .regex(/[a-z]/, 'Mật khẩu mới cần ít nhất một chữ thường.')
    .regex(/[0-9]/, 'Mật khẩu mới cần ít nhất một chữ số.'),
});

/**
 * M01-F01 — Tạo tài khoản CUSTOMER (BR-M01-01, BR-M01-03).
 */
export async function registerAccount({ email, password, full_name, phone }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await findUserByEmail(normalizedEmail)) {
    throw fail(409, ERROR_CODES.EMAIL_TAKEN, undefined, { field: 'email' });
  }

  if (phone && (await findUserByPhone(phone))) {
    throw fail(409, ERROR_CODES.PHONE_TAKEN, undefined, { field: 'phone' });
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

  const invalid = () => fail(401, ERROR_CODES.INVALID_CREDENTIALS);

  if (!user) throw invalid();

  const now = Date.now();
  if (user.locked_until && new Date(user.locked_until).getTime() > now) {
    throw fail(
      423,
      ERROR_CODES.ACCOUNT_LOCKED,
      `Tài khoản đang bị tạm khóa. Vui lòng thử lại sau ${BUSINESS_RULES.AUTH.LOCKOUT_MINUTES} phút.`,
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
        : (user.locked_until ?? null),
    });

    if (shouldLock) {
      throw fail(
        423,
        ERROR_CODES.ACCOUNT_LOCKED,
        `Nhập sai quá nhiều lần. Tài khoản bị tạm khóa ${BUSINESS_RULES.AUTH.LOCKOUT_MINUTES} phút.`,
      );
    }
    throw invalid();
  }

  if (user.status !== 'ACTIVE') {
    throw fail(403, ERROR_CODES.ACCOUNT_DISABLED);
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
 * M01-F02 — Cấp lại access token từ cookie refresh token.
 * Vai trò/trạng thái đọc lại từ DB để thay đổi quyền có hiệu lực ngay sau khi tải lại trang
 * (claim `role` trong refresh token có thể đã cũ).
 */
export async function refreshSession({ refreshToken }) {
  if (!refreshToken) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }
  if (user.status !== 'ACTIVE') {
    throw fail(403, ERROR_CODES.ACCOUNT_DISABLED);
  }

  const { token: accessToken, expiresIn } = await signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const { token: newRefreshToken, expiresIn: refreshTtl } = await signRefreshToken({
    userId: user.id,
    role: user.role,
  });

  const { password_hash: _omit, ...safeUser } = user;
  return {
    access_token: accessToken,
    expires_in: expiresIn,
    user_info: safeUser,
    refresh_token: newRefreshToken,
    refresh_expires_in: refreshTtl,
  };
}

/**
 * M01-F03 — Trả hồ sơ của người dùng đang đăng nhập.
 */
export async function getProfile({ userId }) {
  const user = await findUserById(userId);
  if (!user) {
    throw fail(404, ERROR_CODES.NOT_FOUND, 'Không tìm thấy người dùng.');
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
    throw fail(404, ERROR_CODES.NOT_FOUND, 'Không tìm thấy người dùng.');
  }

  const patch = {};
  if (body.full_name !== undefined) patch.full_name = body.full_name.trim();
  if (body.child_birthdate !== undefined) patch.child_birthdate = body.child_birthdate;
  if (body.avatar_url !== undefined) patch.avatar_url = body.avatar_url;

  if (body.phone !== undefined && body.phone !== user.phone) {
    const owner = await findUserByPhone(body.phone);
    if (owner && owner.id !== userId) {
      throw fail(409, ERROR_CODES.PHONE_TAKEN, undefined, { field: 'phone' });
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
/**
 * TODO(M01-F03) — Đổi mật khẩu sau khi xác minh mật khẩu hiện tại.
 */
/**
 * M01-F03 — Đổi mật khẩu sau khi xác minh mật khẩu hiện tại.
 */
export async function changePassword({ userId, body }) {
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw fail(422, ERROR_CODES.VALIDATION_ERROR, first.message, { field: first.path[0] });
  }
  const { current_password, new_password } = parsed.data;

  const user = await findUserById(userId);
  if (!user) {
    throw fail(404, ERROR_CODES.NOT_FOUND, 'Không tìm thấy người dùng.');
  }

  const currentOk = await bcrypt.compare(current_password, user.password_hash ?? '');
  if (!currentOk) {
    throw fail(422, ERROR_CODES.WRONG_PASSWORD, undefined, { field: 'current_password' });
  }

  if (current_password === new_password) {
    throw fail(422, ERROR_CODES.SAME_PASSWORD, undefined, { field: 'new_password' });
  }

  const passwordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
  await updateUser(userId, { password_hash: passwordHash });

  return { success: true };
}

/**
 * TODO(M01-F04) — Liệt kê tối đa 10 địa chỉ, đúng một địa chỉ mặc định (BR-M01-04).
 */
export async function listAddresses({ userId }) {
  return listAddressesByUser(userId);
}

/** M01-F04 — Thêm địa chỉ, tối đa 10 địa chỉ; địa chỉ đầu tiên tự là mặc định. */
export async function createAddress({ userId, body }) {
  const input = parseAddressInput(body);
  const existing = await listAddressesByUser(userId);

  if (existing.length >= MAX_ADDRESSES) {
    throw fail(409, 'ADDRESS_LIMIT', `Mỗi tài khoản tối đa ${MAX_ADDRESSES} địa chỉ.`);
  }

  const makeDefault = existing.length === 0 || input.is_default === true;
  return insertAddress({ user_id: userId, ...toRow(input), is_default: makeDefault });
}

/** M01-F04 — Sửa địa chỉ thuộc chủ tài khoản (BR-M01-04). */
export async function updateAddress({ userId, id, body }) {
  const current = await findAddressForUser(id, userId);
  if (!current) throw fail(404, 'NOT_FOUND', 'Không tìm thấy địa chỉ.');

  const input = parseAddressInput(body);
  if (input.is_default === false && current.is_default) {
    throw fail(422, 'DEFAULT_REQUIRED', 'Hãy chọn địa chỉ mặc định khác trước khi bỏ mặc định.');
  }

  const isDefault = current.is_default || input.is_default === true;
  return patchAddress(id, userId, { ...toRow(input), is_default: isDefault });
}

/** M01-F04 — Xóa mềm; không xóa địa chỉ mặc định khi còn địa chỉ khác (khớp trigger trong schema). */
export async function deleteAddress({ userId, id }) {
  const current = await findAddressForUser(id, userId);
  if (!current) throw fail(404, 'NOT_FOUND', 'Không tìm thấy địa chỉ.');

  if (current.is_default) {
    const others = (await listAddressesByUser(userId)).filter((a) => a.id !== id);
    if (others.length > 0) {
      throw fail(
        422,
        'DEFAULT_REQUIRED',
        'Hãy chọn địa chỉ mặc định khác trước khi xóa địa chỉ này.',
      );
    }
  }

  await patchAddress(id, userId, { deleted_at: new Date().toISOString(), is_default: false });
  return { success: true };
}

/** M01-F04 — Đặt địa chỉ mặc định duy nhất. */
export async function setDefaultAddress({ userId, id }) {
  const current = await findAddressForUser(id, userId);
  if (!current) throw fail(404, 'NOT_FOUND', 'Không tìm thấy địa chỉ.');

  return patchAddress(id, userId, { is_default: true });
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

/**
 * M01-F02 — Đăng xuất. Cookie được xóa ở handler; thu hồi refresh token
 * phía database sẽ làm khi có bảng refresh_tokens.
 */
export async function logout() {
  return { success: true };
}
