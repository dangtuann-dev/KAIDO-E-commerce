import 'server-only';

/**
 * [SERVER] Kiểm tra chữ ký HMAC cho webhook/IPN (VNPAY, MoMo, ZaloPay, ĐVVC).
 * SRS: 2.5 — webhook đọc raw body, xác thực HMAC trước khi xử lý.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { AppError } from '@/server/http/errors.js';

/**
 * @param {string | Buffer} payload Chuỗi canonical hoặc raw body.
 * @param {string} secret
 * @param {{ algorithm?: string, encoding?: 'hex' | 'base64' | 'base64url' }} [options]
 * @returns {string}
 */
export function computeHmac(payload, secret, options = {}) {
  if (!secret) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Thiếu khóa bí mật để tính HMAC.');
  }
  return createHmac(options.algorithm || 'sha256', secret)
    .update(payload)
    .digest(options.encoding || 'hex');
}

/**
 * So sánh chuỗi theo thời gian hằng.
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
export function timingSafeEqualStrings(left, right) {
  const leftBuffer = Buffer.from(String(left ?? ''), 'utf8');
  const rightBuffer = Buffer.from(String(right ?? ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * @param {{ payload: string | Buffer, signature: string, secret: string, algorithm?: string, encoding?: 'hex' | 'base64' | 'base64url' }} input
 * @returns {boolean}
 */
export function verifySignature({ payload, signature, secret, algorithm, encoding }) {
  if (!signature || typeof signature !== 'string') return false;
  const expected = computeHmac(payload, secret, { algorithm, encoding });
  return timingSafeEqualStrings(expected, signature.trim());
}

/**
 * @param {Parameters<typeof verifySignature>[0]} input
 * @returns {true}
 */
export function verifySignatureOrThrow(input) {
  if (!verifySignature(input)) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Chữ ký không hợp lệ.');
  }
  return true;
}
