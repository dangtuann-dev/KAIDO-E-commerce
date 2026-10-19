import 'server-only';

/**
 * [SERVER] Hỗ trợ giỏ khách vãng lai qua header X-Guest-Session-Id — M04 / BR-M04-04.
 * Client tự sinh ID và lưu bền; tuyệt đối không dùng cơ chế này thay access token.
 */
import { randomUUID } from 'node:crypto';
import { GUEST_SESSION_HEADER } from '@/shared/constants/auth.js';

const GUEST_SESSION_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidGuestSessionId(value) {
  return typeof value === 'string' && GUEST_SESSION_PATTERN.test(value);
}

/**
 * Trả ID hợp lệ hoặc null. Header sai định dạng bị bỏ qua để không chặn các API công khai.
 * @param {Request} request
 * @returns {string | null}
 */
export function getGuestSessionId(request) {
  const value = request.headers.get(GUEST_SESSION_HEADER)?.trim();
  return isValidGuestSessionId(value) ? value : null;
}

/** @returns {string} */
export function createGuestSessionId() {
  return randomUUID();
}
