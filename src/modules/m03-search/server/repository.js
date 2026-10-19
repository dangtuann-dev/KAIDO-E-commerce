import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M03 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze(['search_history']);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M03-F11) — bảng `search_history`.
 */
export async function insertSearchHistory(_data) {
  throw new NotImplementedError('M03-F11');
}

/**
 * TODO(M03-F12) — bảng `search_history`.
 */
export async function listPopularKeywords(_limit) {
  throw new NotImplementedError('M03-F12');
}

/**
 * TODO(M03-F12) — bảng `search_history`.
 */
export async function listZeroResultKeywords(_dateFrom, _dateTo) {
  throw new NotImplementedError('M03-F12');
}

/**
 * TODO(M03-F12) — bảng `search_history`.
 */
export async function countSearches(_dateFrom, _dateTo) {
  throw new NotImplementedError('M03-F12');
}
