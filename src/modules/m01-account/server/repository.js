import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M01 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'users',
  'addresses',
  'refresh_tokens',
  'password_reset_otps',
  'notifications',
]);

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
export async function findUserByEmail(_email) {
  throw new NotImplementedError('M01-F01');
}

/**
 * TODO(M01-F01) — bảng `users`.
 */
export async function createUser(_data) {
  throw new NotImplementedError('M01-F01');
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
