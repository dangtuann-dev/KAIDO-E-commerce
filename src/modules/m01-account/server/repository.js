import 'server-only';
import { getSupabaseAdmin, rpc } from '@/server/db/supabase.js';
import { fromSupabaseError, NotImplementedError } from '@/server/http/errors.js';

/** Bảng M01 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'users',
  'addresses',
  'refresh_tokens',
  'password_reset_otps',
  'notifications',
]);

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data;
}

/** @param {string} table */
const from = (table) => getSupabaseAdmin().from(table);

/**
 * M01-F03 — bảng `users`.
 */
export async function findUserById(id) {
  return run(from('users').select('*').eq('id', id).is('deleted_at', null).maybeSingle());
}

/**
 * M01-F01 — bảng `users`.
 */
export async function findUserByEmail(email) {
  const target = String(email).trim().toLowerCase();
  return run(from('users').select('*').eq('email', target).is('deleted_at', null).maybeSingle());
}

/**
 * M01-F01 — bảng `users`, tìm theo số điện thoại.
 */
export async function findUserByPhone(phone) {
  return run(from('users').select('*').eq('phone', phone).is('deleted_at', null).maybeSingle());
}

/**
 * M01-F01 — bảng `users`. DB sinh id và timestamp; vi phạm unique email/SĐT ném AppError (23505).
 */
export async function createUser(data) {
  return run(from('users').insert(data).select().single());
}

/**
 * M01-F03 — bảng `users`. Trả null khi dòng không còn tồn tại; `updated_at` do trigger DB cập nhật.
 */
export async function updateUser(id, patch) {
  return run(from('users').update(patch).eq('id', id).is('deleted_at', null).select().maybeSingle());
}

/**
 * M01-F04 — bảng `addresses`.
 */
export async function listAddressesByUser(userId) {
  return run(
    from('addresses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true }),
  );
}

export async function findAddressForUser(id, userId) {
  return run(
    from('addresses').select('*').eq('id', id).eq('user_id', userId).is('deleted_at', null).maybeSingle(),
  );
}

/**
 * M01-F04 — bảng `addresses`. RPC giữ nguyên tử giới hạn 10 địa chỉ và đúng 1 mặc định.
 */
export async function insertAddress(data) {
  const { user_id: userId, ...payload } = data;
  return rpc('manage_user_address', { p_action: 'create', p_user_id: userId, p_data: payload });
}

/**
 * Điều hướng thao tác tới đúng nhánh của RPC: xóa mềm / đặt mặc định / cập nhật.
 */
export async function patchAddress(id, userId, patch) {
  const keys = Object.keys(patch);
  const action = patch.deleted_at
    ? 'delete'
    : keys.length === 1 && patch.is_default === true
      ? 'set_default'
      : 'update';

  return rpc('manage_user_address', {
    p_action: action,
    p_user_id: userId,
    p_address_id: id,
    p_data: patch,
  });
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
