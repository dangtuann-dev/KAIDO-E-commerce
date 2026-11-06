import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { buildPaginationMeta } from '@/server/http/pagination.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { REVIEW_LIMITS, inferMediaType } from './constants.js';

/**
 * [SERVER] M10 — helper dùng chung cho service đánh giá và ticket.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

export function notFound(message = 'Không tìm thấy dữ liệu.') {
  return fail(404, ERROR_CODES.NOT_FOUND, message);
}

export function conflict(message, details) {
  return fail(409, ERROR_CODES.CONFLICT, message, details);
}

export function invalid(message, details) {
  return fail(422, ERROR_CODES.VALIDATION_ERROR, message, details);
}

export function forbidden(message = 'Bạn không có quyền thực hiện thao tác này.') {
  return fail(403, ERROR_CODES.FORBIDDEN, message);
}

export function isUuid(value) {
  return UUID_PATTERN.test(String(value ?? '').trim());
}

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function pagedResult({ rows, total, page, limit, mapRow }) {
  return {
    items: rows.map(mapRow),
    ...buildPaginationMeta({ page, limit, total }),
  };
}

/**
 * BR-M10-05 — tối đa 5 ảnh hoặc 1 video cho mỗi đánh giá/tin nhắn ticket.
 * Chỉ nhận URL nên file_size_bytes chưa xác định (0 = không khai báo).
 */
export function normalizeMedia(urls = []) {
  const rows = urls.map((url, index) => ({
    media_type: inferMediaType(url),
    url,
    file_url: url,
    file_size_bytes: 0,
    sort_order: index,
  }));

  const images = rows.filter((row) => row.media_type === 'IMAGE');
  const videos = rows.filter((row) => row.media_type === 'VIDEO');

  if (images.length > REVIEW_LIMITS.maxImageFiles) {
    throw invalid(`Mỗi nội dung chỉ đính kèm tối đa ${REVIEW_LIMITS.maxImageFiles} ảnh.`);
  }
  if (videos.length > REVIEW_LIMITS.maxVideoFiles) {
    throw invalid(`Mỗi nội dung chỉ đính kèm tối đa ${REVIEW_LIMITS.maxVideoFiles} video.`);
  }

  return rows;
}

/** Chuỗi ký tự đếm theo code point để khớp CHECK char_length của Postgres. */
export function charLength(value) {
  return Array.from(String(value ?? '')).length;
}

export function isStaffRole(role) {
  return role === 'ADMIN' || role === 'STAFF';
}
