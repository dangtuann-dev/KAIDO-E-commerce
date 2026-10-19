import 'server-only';

/**
 * [SERVER] Handler factory dùng cho khung module giai đoạn nền tảng.
 * Mọi handler chưa cài đặt trả 501 NOT_IMPLEMENTED kèm mã API (SRS 2.5).
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {string} code Mã API trong registry, ví dụ "API-M05-02".
 * @returns {(ctx: import('@/server/http/withApi.js').ApiHandlerContext) => Promise<never>}
 */
export function notImplementedHandler(code) {
  return async function notImplementedApiHandler() {
    throw new NotImplementedError(code);
  };
}

/**
 * @param {readonly string[]} codes
 * @returns {Readonly<Record<string, ReturnType<typeof notImplementedHandler>>>}
 */
export function buildNotImplementedHandlers(codes) {
  return Object.freeze(
    Object.fromEntries(codes.map((code) => [code, notImplementedHandler(code)])),
  );
}
