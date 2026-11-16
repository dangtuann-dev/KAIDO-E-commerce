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
 * M01-F05 — bảng `password_reset_otps`. Đếm số lần gửi trong khung giờ để chặn spam.
 */
export async function countPasswordResetOtpsSince(userId, sinceIso) {
  const { count, error } = await from('password_reset_otps')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

/**
 * M01-F05 — bảng `password_reset_otps`. Vô hiệu hóa mọi OTP cũ trước khi phát mã mới.
 */
export async function consumeActivePasswordResetOtps(userId) {
  return run(
    from('password_reset_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('consumed_at', null)
      .select('id'),
  );
}

/**
 * M01-F05 — bảng `password_reset_otps`. DB chỉ lưu hash của OTP.
 */
export async function createPasswordResetOtp(userId, data) {
  return run(
    from('password_reset_otps')
      .insert({ user_id: userId, ...data })
      .select('id,expires_at')
      .single(),
  );
}

/**
 * M01-F05 — bảng `password_reset_otps`. OTP còn hiệu lực mới nhất của người dùng.
 */
export async function findLatestPasswordResetOtp(userId) {
  return run(
    from('password_reset_otps')
      .select('*')
      .eq('user_id', userId)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

/**
 * M01-F05 — bảng `password_reset_otps`. Đánh dấu đã dùng, trả null nếu đã dùng trước đó.
 */
export async function consumePasswordResetOtp(id) {
  return run(
    from('password_reset_otps')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id)
      .is('consumed_at', null)
      .select('id')
      .maybeSingle(),
  );
}

/**
 * M01-F05 — bảng `notifications`. Xếp OTP vào hàng đợi email (worker gửi ngoài phạm vi nền tảng).
 */
export async function enqueuePasswordResetOtp(userId, payload) {
  return run(
    from('notifications')
      .insert({
        user_id: userId,
        channel: 'EMAIL',
        template_key: 'PASSWORD_RESET_OTP',
        payload,
      })
      .select('id')
      .maybeSingle(),
  );
}

/**
 * M01-F07 — danh sách người dùng back-office, lọc theo vai trò/trạng thái/từ khóa (BR-M01-05).
 */
export async function listUsers({ page = 1, limit = 20, role = null, status = null, search = null } = {}) {
  const offset = (page - 1) * limit;
  let builder = from('users')
    .select(
      'id,email,phone,full_name,avatar_url,role,status,child_birthdate,last_login_at,created_at',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) builder = builder.eq('role', role);
  if (status) builder = builder.eq('status', status);

  const term = String(search ?? '')
    .replace(/[%_,()]/g, ' ')
    .trim();
  if (term) {
    builder = builder.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await builder;
  if (error) throw fromSupabaseError(error);
  return { total: count ?? (data?.length ?? 0), rows: data ?? [] };
}

/**
 * M07-F06 — bảng `users`, danh sách khách có `child_birthdate` trong tháng.
 * PostgREST không lọc theo tháng nên đọc các khách còn hoạt động rồi lọc tại server.
 */
export async function listUsersWithBirthdayInMonth(month) {
  const target = Number(month);
  if (!Number.isInteger(target) || target < 1 || target > 12) return [];

  const rows = await run(
    from('users')
      .select('id,full_name,email,child_birthdate')
      .eq('role', 'CUSTOMER')
      .eq('status', 'ACTIVE')
      .is('deleted_at', null)
      .not('child_birthdate', 'is', null),
  );

  return (rows ?? []).filter(
    (row) => new Date(row.child_birthdate).getMonth() + 1 === target,
  );
}
