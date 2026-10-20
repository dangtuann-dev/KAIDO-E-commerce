import 'server-only';
import { randomUUID } from 'node:crypto';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M01 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'users',
  'addresses',
  'refresh_tokens',
  'password_reset_otps',
  'notifications',
]);

const store = (globalThis.__kaidoUsers ??= new Map());

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M01-F03) — bảng `users`.
 */
export async function findUserById(_id) {
  throw new NotImplementedError('M01-F03');
}

/**
 * TODO(M01-F01) — bảng `users`.
 */
export async function findUserByEmail(email) {
  const target = String(email).trim().toLowerCase();
  for (const user of store.values()) {
    if (user.email === target && !user.deleted_at) return user;
  }
  return null;
}

/**
 * TODO(M01-F01) — bảng `users`, tìm theo số điện thoại.
 */
export async function findUserByPhone(phone) {
  for (const user of store.values()) {
    if (user.phone === phone && !user.deleted_at) return user;
  }
  return null;
}

/**
 * TODO(M01-F01) — bảng `users`.
 */
export async function createUser(data) {
  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...data,
  };
  store.set(user.id, user);
  return user;
}

/**
 * TODO(M01-F03) — bảng `users`.
 */
export async function updateUser(_id, _patch) {
  throw new NotImplementedError('M01-F03');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function listAddressesByUser(_userId) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function countAddressesByUser(_userId) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function createAddress(_userId, _data) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function updateAddress(_id, _userId, _patch) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function softDeleteAddress(_id, _userId) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F04) — bảng `addresses`.
 */
export async function setDefaultAddress(_id, _userId) {
  throw new NotImplementedError('M01-F04');
}

/**
 * TODO(M01-F02) — bảng `refresh_tokens`.
 */
export async function createRefreshToken(_userId, _data) {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F02) — bảng `refresh_tokens`.
 */
export async function findRefreshTokenByHash(_tokenHash) {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F02) — bảng `refresh_tokens`.
 */
export async function revokeRefreshToken(_id) {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F02) — bảng `refresh_tokens`.
 */
export async function revokeRefreshTokensForUser(_userId) {
  throw new NotImplementedError('M01-F02');
}

/**
 * TODO(M01-F05) — bảng `password_reset_otps`.
 */
export async function createPasswordResetOtp(_userId, _data) {
  throw new NotImplementedError('M01-F05');
}

/**
 * TODO(M01-F05) — bảng `password_reset_otps`.
 */
export async function findLatestPasswordResetOtp(_userId) {
  throw new NotImplementedError('M01-F05');
}

/**
 * TODO(M01-F05) — bảng `password_reset_otps`.
 */
export async function consumePasswordResetOtp(_id) {
  throw new NotImplementedError('M01-F05');
}
