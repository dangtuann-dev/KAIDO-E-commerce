import 'server-only';

/**
 * [SERVER] Rate limit theo IP với preset từ endpoint registry.
 * SRS: NFR-M09-02 (thử voucher 10 lần/phút/IP), BR-M01-02 (chống dò mật khẩu).
 *
 * Preset `auth` và `search` chưa có ngưỡng số cụ thể trong SRS — xem docs/OPEN_DECISIONS.md.
 * Adapter bộ nhớ chỉ dùng khi dev/test; production cần Upstash/KV (TODO ở src/server/cache).
 */
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getCache } from '@/server/cache/index.js';
import { AppError } from '@/server/http/errors.js';

export const RATE_LIMIT_PRESETS = Object.freeze({
  auth: Object.freeze({
    limit: 10,
    windowSeconds: 60,
    description: 'Đăng ký/đăng nhập/quên mật khẩu — chống brute force (BR-M01-02).',
  }),
  search: Object.freeze({
    limit: 60,
    windowSeconds: 60,
    description: 'Tìm kiếm/autocomplete — bảo vệ API công khai.',
  }),
  voucher: Object.freeze({
    limit: 10,
    windowSeconds: 60,
    description: 'Thử mã giảm giá — NFR-M09-02 (10 lần/phút/IP).',
  }),
});

/**
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const firstForwarded = forwarded ? forwarded.split(',')[0].trim() : '';
  const realIp = request.headers.get('x-real-ip')?.trim() || '';
  return (firstForwarded || realIp || 'unknown').slice(0, 64);
}

/**
 * Tăng bộ đếm và trả thông tin giới hạn. Ném 429 khi vượt ngưỡng.
 * @param {Request} request
 * @param {string | undefined} presetName
 * @returns {Promise<{ limit: number, remaining: number, resetAt: number, resetSeconds: number, headers: Record<string, string> } | null>}
 */
export async function checkRateLimit(request, presetName) {
  if (!presetName) return null;

  const preset = RATE_LIMIT_PRESETS[presetName];
  if (!preset) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      `Rate limit preset "${presetName}" không tồn tại.`,
    );
  }

  const ip = getClientIp(request);
  const key = `rate-limit:${presetName}:${ip}`;
  const { count, resetAt } = await getCache().increment(key, preset.windowSeconds);
  const resetSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const remaining = Math.max(0, preset.limit - count);
  const headers = {
    'x-ratelimit-limit': String(preset.limit),
    'x-ratelimit-remaining': String(remaining),
    'x-ratelimit-reset': String(resetSeconds),
  };

  if (count > preset.limit) {
    throw new AppError(ERROR_CODES.RATE_LIMITED, undefined, {
      details: {
        preset: presetName,
        limit: preset.limit,
        window_seconds: preset.windowSeconds,
        retry_after_seconds: resetSeconds,
      },
      headers: { ...headers, 'retry-after': String(resetSeconds) },
    });
  }

  return { limit: preset.limit, remaining, resetAt, resetSeconds, headers };
}
