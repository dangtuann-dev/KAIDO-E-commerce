import 'server-only';

/**
 * [SERVER] Cookie refresh token HttpOnly — M01-F02, SRS 2.3.
 * Access token KHÔNG đặt cookie/localStorage; chỉ giữ trong bộ nhớ phía client.
 */
import { REFRESH_TOKEN_COOKIE } from '@/shared/constants/auth.js';
import { getEnv } from '@/server/env.js';

/**
 * @param {string} token
 * @param {{ maxAgeSeconds?: number }} [options]
 * @returns {string}
 */
export function serializeRefreshTokenCookie(token, options = {}) {
  const maxAge = Math.max(1, Number(options.maxAgeSeconds) || getEnv().JWT_REFRESH_TTL);
  const secure = process.env.NODE_ENV === 'production';

  return [
    `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

/**
 * @returns {string}
 */
export function serializeClearedRefreshTokenCookie() {
  const secure = process.env.NODE_ENV === 'production';
  return [
    `${REFRESH_TOKEN_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

/**
 * @param {Request} request
 * @param {string} name
 * @returns {string | null}
 */
export function getCookieValue(request, name) {
  const header = request.headers.get('cookie');
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

/**
 * @param {Request} request
 * @returns {string | null}
 */
export function getRefreshTokenFromRequest(request) {
  return getCookieValue(request, REFRESH_TOKEN_COOKIE);
}

/**
 * @param {Response} response
 * @param {string} cookie
 * @returns {Response}
 */
export function appendSetCookie(response, cookie) {
  const headers = new Headers(response.headers);
  headers.append('set-cookie', cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * @param {Response} response
 * @param {string} token
 * @param {{ maxAgeSeconds?: number }} [options]
 * @returns {Response}
 */
export function attachRefreshTokenCookie(response, token, options = {}) {
  return appendSetCookie(response, serializeRefreshTokenCookie(token, options));
}

/**
 * @param {Response} response
 * @returns {Response}
 */
export function clearRefreshTokenCookie(response) {
  return appendSetCookie(response, serializeClearedRefreshTokenCookie());
}
