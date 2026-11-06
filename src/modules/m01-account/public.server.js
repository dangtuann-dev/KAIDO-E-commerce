import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ACCOUNT_STATUS } from './server/constants.js';
import * as repo from './server/repository.js';

/**
 * [SERVER] Hợp đồng công khai của M01 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

/**
 * M07-F06 — khách hàng có ngày sinh của bé trong tháng (voucher sinh nhật).
 * @param {number} month 1–12
 */
export async function listCustomersWithBirthday(month) {
  return repo.listUsersWithBirthdayInMonth(month);
}
/**
 * M01-F03 — Lấy email, SĐT và tên hiển thị cho M05/M06/M10.
 * Trả `null` khi không tìm thấy tài khoản.
 * @param {string} userId
 */
export async function getUserContact(userId) {
  if (!userId) return null;
  const user = await repo.findUserById(userId);
  if (!user) return null;

  return {
    user_id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    full_name: user.full_name ?? null,
    display_name: maskDisplayName(user),
    status: user.status ?? null,
  };
}

/**
 * M01-F03 — Tên hiển thị cho đánh giá/ticket của M10 (che bớt email/SĐT).
 * @param {string} userId
 */
export async function getCustomerDisplayName(userId) {
  const contact = await getUserContact(userId);
  return contact?.display_name ?? 'Khách hàng KAIDO';
}

/**
 * M01-F07 — Chặn tài khoản LOCKED/DISABLED trước thao tác nghiệp vụ.
 * @param {string} userId
 */
export async function assertActiveUser(userId) {
  if (!userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

  const user = await repo.findUserById(userId);
  if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy tài khoản.');
  if (user.status === ACCOUNT_STATUS.LOCKED) {
    throw new AppError(ERROR_CODES.ACCOUNT_LOCKED);
  }
  if (user.status === ACCOUNT_STATUS.DISABLED) {
    throw new AppError(ERROR_CODES.ACCOUNT_DISABLED);
  }

  return { user_id: user.id, status: user.status ?? ACCOUNT_STATUS.ACTIVE };
}

/**
 * Hiển thị công khai: ưu tiên tên, sau đó che bớt email/SĐT (NFR-M10-02).
 */
function maskDisplayName(user) {
  const name = String(user.full_name ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}***`;
  }

  const email = String(user.email ?? '').trim();
  if (email.includes('@')) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }

  const phone = String(user.phone ?? '').trim();
  if (phone.length >= 4) return `***${phone.slice(-3)}`;

  return 'Khách hàng KAIDO';
}
