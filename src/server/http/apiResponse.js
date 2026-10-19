import 'server-only';

/**
 * [SERVER] Tạo Response JSON theo envelope chuẩn — SRS 2.5.
 * Thành công: { success:true, data, meta? }
 * Lỗi:       { success:false, error:{ code, message, details? }, requestId }
 */
import { REQUEST_ID_HEADER } from '@/shared/constants/auth.js';
import { ERROR_CODES, HTTP_STATUS_BY_ERROR } from '@/shared/constants/error-codes.js';
import { AppError, normalizeError } from '@/server/http/errors.js';

/**
 * @param {unknown} payload
 * @param {{ status?: number, headers?: HeadersInit, requestId?: string }} [options]
 * @returns {Response}
 */
export function jsonResponse(payload, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  if (options.requestId) headers.set(REQUEST_ID_HEADER, options.requestId);

  return new Response(JSON.stringify(payload), {
    status: options.status ?? 200,
    headers,
  });
}

/**
 * @param {unknown} data
 * @param {{ status?: number, meta?: Record<string, unknown> | null, headers?: HeadersInit, requestId?: string }} [options]
 * @returns {Response}
 */
export function successResponse(data, options = {}) {
  const meta = {
    ...(options.meta || {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
  };
  const payload =
    Object.keys(meta).length > 0 ? { success: true, data, meta } : { success: true, data };

  return jsonResponse(payload, {
    status: options.status ?? 200,
    headers: options.headers,
    requestId: options.requestId,
  });
}

/**
 * @param {unknown} error Lỗi AppError hoặc lỗi bất kỳ (sẽ chuẩn hóa).
 * @param {{ requestId?: string, headers?: HeadersInit }} [options]
 * @returns {Response}
 */
export function errorResponse(error, options = {}) {
  const appError = error instanceof AppError ? error : normalizeError(error);
  const code = appError.code || ERROR_CODES.INTERNAL_ERROR;
  const message = appError.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.';
  const status = appError.status ?? HTTP_STATUS_BY_ERROR[code] ?? 500;

  const errorBody = { code, message };
  if (appError.details !== undefined) errorBody.details = appError.details;

  const headers = new Headers(options.headers);
  for (const [name, value] of Object.entries(appError.headers || {})) {
    headers.set(name, value);
  }

  return jsonResponse(
    {
      success: false,
      error: errorBody,
      requestId: options.requestId || 'unknown',
    },
    {
      status,
      headers,
      requestId: options.requestId,
    },
  );
}
