import 'server-only';

/**
 * [SERVER] Lỗi ứng dụng + chuẩn hóa lỗi Supabase/PostgREST.
 * SRS: 2.5 — envelope lỗi { success:false, error:{ code, message, details? }, requestId }.
 */
import {
  ERROR_CODES,
  ERROR_MESSAGES_VI,
  HTTP_STATUS_BY_ERROR,
} from '@/shared/constants/error-codes.js';

export class AppError extends Error {
  /**
   * @param {string} code Mã trong ERROR_CODES.
   * @param {string} [message] Thông điệp hiển thị cho client.
   * @param {{ status?: number, details?: unknown, headers?: Record<string, string>, cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    const normalizedCode = Object.prototype.hasOwnProperty.call(ERROR_CODES, code)
      ? code
      : ERROR_CODES.INTERNAL_ERROR;

    super(message || ERROR_MESSAGES_VI[normalizedCode] || ERROR_MESSAGES_VI.INTERNAL_ERROR, {
      cause: options.cause,
    });

    this.name = 'AppError';
    this.code = normalizedCode;
    this.status = options.status ?? HTTP_STATUS_BY_ERROR[normalizedCode] ?? 500;
    this.details = options.details;
    this.headers = options.headers ?? {};
    this.isOperational = true;
  }
}

export class NotImplementedError extends AppError {
  /**
   * @param {string} reference Mã SRS/API, ví dụ "M05-F06" hoặc "API-M05-02".
   * @param {string} [message]
   */
  constructor(reference, message) {
    super(ERROR_CODES.NOT_IMPLEMENTED, message || `Chức năng ${reference} chưa được triển khai.`, {
      details: { todo: reference },
    });
    this.name = 'NotImplementedError';
    this.reference = reference;
  }
}

export class DatabaseNotConfiguredError extends AppError {
  constructor() {
    super(
      ERROR_CODES.DATABASE_NOT_CONFIGURED,
      'Supabase chưa được cấu hình (SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY).',
    );
    this.name = 'DatabaseNotConfiguredError';
  }
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAppError(error) {
  return error instanceof AppError;
}

/**
 * Chuyển lỗi PostgREST/PostgreSQL thành AppError, không làm lộ chi tiết nội bộ.
 * TODO(M01): bổ sung map mã lỗi nghiệp vụ riêng của từng RPC khi cài đặt service.
 * @param {unknown} error
 * @returns {AppError}
 */
export function fromSupabaseError(error) {
  if (error instanceof AppError) return error;

  const source = /** @type {{ code?: string, message?: string, details?: string }} */ (
    error && typeof error === 'object' ? error : {}
  );
  const code = typeof source.code === 'string' ? source.code : '';

  if (code === '23505') {
    return new AppError(ERROR_CODES.DUPLICATE_RESOURCE, undefined, { cause: error });
  }
  if (code === '23503') {
    return new AppError(ERROR_CODES.CONFLICT, 'Dữ liệu đang được tham chiếu ở nơi khác.', {
      cause: error,
    });
  }
  if (['23514', '22P02', '22007', '22003', '22001'].includes(code)) {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, undefined, { cause: error });
  }
  if (code === 'PGRST116') {
    return new AppError(ERROR_CODES.NOT_FOUND, undefined, { cause: error });
  }
  if (code === '42501') {
    return new AppError(ERROR_CODES.FORBIDDEN, undefined, { cause: error });
  }
  if (code === 'PGRST301') {
    return new AppError(ERROR_CODES.INVALID_TOKEN, undefined, { cause: error });
  }
  if (code === '42P01') {
    return new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Cơ sở dữ liệu chưa được khởi tạo đầy đủ. Hãy chạy database/schema.sql.',
      { cause: error },
    );
  }
  if (code === 'P0001' && source.message) {
    // RPC nghiệp vụ dùng RAISE EXCEPTION với thông điệp tiếng Việt dành cho người dùng.
    return new AppError(ERROR_CODES.CONFLICT, source.message, {
      details: { reason: 'database_rule' },
      cause: error,
    });
  }
  if (source.message && /fetch failed|network|timeout|ENOTFOUND|ECONN/i.test(source.message)) {
    return new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, undefined, { cause: error });
  }

  return new AppError(ERROR_CODES.INTERNAL_ERROR, undefined, { cause: error });
}

/**
 * Chuẩn hóa bất kỳ lỗi nào thành AppError để withApi bọc envelope.
 * @param {unknown} error
 * @returns {AppError}
 */
export function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error && typeof error === 'object' && 'code' in error) {
    const appError = fromSupabaseError(error);
    if (appError.code !== ERROR_CODES.INTERNAL_ERROR) return appError;
  }
  return new AppError(ERROR_CODES.INTERNAL_ERROR, undefined, { cause: error });
}
