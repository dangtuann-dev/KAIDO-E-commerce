import 'server-only';
import {
  searchProducts,
  getPopularKeywords,
} from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M03 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

/**
 * M03-F01 — Cho phép module nội bộ tái sử dụng tìm kiếm; M03 chỉ đọc M02.
 * @param {{ query?: Record<string, unknown>, userId?: string | null, guestSessionId?: string | null }} [input]
 */
export async function searchCatalogIndex(input = {}) {
  return searchProducts(input);
}

/**
 * M03-F12 — Từ khóa phổ biến dùng chung cho gợi ý.
 * @param {number} [limit]
 */
export async function getPopularSearchTerms(limit = 10) {
  return getPopularKeywords({ query: { limit } });
}
