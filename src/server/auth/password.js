import 'server-only';

/**
 * [SERVER] Băm/kiểm tra mật khẩu bằng bcryptjs (không native) — M01-F01, BR-M01-01.
 * Salt rounds tối thiểu 10, mặc định 12 qua BCRYPT_ROUNDS.
 */
import { compare, getRounds, hash } from 'bcryptjs';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getBcryptRounds } from '@/server/env.js';
import { AppError } from '@/server/http/errors.js';

/**
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Mật khẩu là bắt buộc.');
  }
  const rounds = Math.max(BUSINESS_RULES.AUTH.BCRYPT_MIN_ROUNDS, getBcryptRounds());
  return hash(plainPassword, rounds);
}

/**
 * @param {string} plainPassword
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== 'string' || typeof passwordHash !== 'string') return false;
  if (!plainPassword || !passwordHash) return false;

  try {
    return await compare(plainPassword, passwordHash);
  } catch {
    return false;
  }
}

/**
 * Dùng khi đổi BCRYPT_ROUNDS: nên băm lại sau lần đăng nhập kế tiếp.
 * @param {string} passwordHash
 * @returns {boolean}
 */
export function passwordNeedsRehash(passwordHash) {
  try {
    return getRounds(passwordHash) < getBcryptRounds();
  } catch {
    return true;
  }
}
