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

const nowIso = () => new Date().toISOString();

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M01-F03) — bảng `users`.
 */
export async function findUserById(id) {
  return store.get(id) ?? null;
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
export async function updateUser(id, patch) {
  const user = store.get(id);
  if (!user) return null;
  const updated = { ...user, ...patch, updated_at: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

/**
 * M01-F04 — bảng `addresses`.
 */
export async function listAddressesByUser(userId) {
  return [...store.values()]
    .filter((a) => a.user_id === userId && !a.deleted_at)
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.created_at.localeCompare(b.created_at),
    );
}

export async function findAddressForUser(id, userId) {
  const row = store.get(id);
  return row && row.user_id === userId && !row.deleted_at ? row : null;
}

export async function insertAddress(data) {
  const t = nowIso();
  const row = { id: randomUUID(), created_at: t, updated_at: t, deleted_at: null, ...data };
  store.set(row.id, row);
  return row;
}

export async function patchAddress(id, patch) {
  const row = store.get(id);
  if (!row) return null;
  const updated = { ...row, ...patch, updated_at: nowIso() };
  store.set(id, updated);
  return updated;
}

export async function clearOtherDefaults(userId, exceptId) {
  for (const row of store.values()) {
    if (row.user_id === userId && row.id !== exceptId && row.is_default && !row.deleted_at) {
      store.set(row.id, { ...row, is_default: false, updated_at: nowIso() });
    }
  }
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
