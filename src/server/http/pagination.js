import 'server-only';

/**
 * [SERVER] Chuẩn hóa phân trang — SRS M03-F08, business-rules CATALOG.DEFAULT_PAGE_SIZE.
 */
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';

export const DEFAULT_PAGE_SIZE = BUSINESS_RULES.CATALOG.DEFAULT_PAGE_SIZE;
export const MAX_PAGE_SIZE = 100;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * @param {URLSearchParams | Record<string, unknown>} [query]
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query) {
  const read = (key) => {
    if (!query) return undefined;
    return query instanceof URLSearchParams ? query.get(key) : query[key];
  };

  const page = toPositiveInt(read('page'), 1);
  const limit = Math.min(toPositiveInt(read('limit'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * @param {{ page: number, limit: number, total: number }} input
 * @returns {{ page: number, limit: number, total: number, total_pages: number, has_next: boolean, has_prev: boolean }}
 */
export function buildPaginationMeta({ page, limit, total }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const safeTotal = Math.max(0, Number(total) || 0);
  const totalPages = Math.ceil(safeTotal / safeLimit);

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    total_pages: totalPages,
    has_next: safePage < totalPages,
    has_prev: safePage > 1,
  };
}
