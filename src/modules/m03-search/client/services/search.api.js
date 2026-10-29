/**
 * [TOY-M03] Client services — Tìm kiếm, lọc, sắp xếp
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api } from '@/shared/lib/http.js';

/**
 * API-M03-01 — Tìm kiếm sản phẩm
 * Faceted search theo từ khóa, danh mục, thương hiệu, giá, độ tuổi, tồn kho.
 * GET /api/v1/search/products · quyền: công khai
 * Input: keyword, category_id[], brand_id[], price_min, price_max, age_group[], gender, in_stock, on_sale, sort, page, limit
 * Output: { total, page, limit, results: [Product], facets: {} }
 */
export function searchProducts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M03-01');
  return api.get(endpoint.path, { query });
}

/**
 * API-M03-02 — Gợi ý từ khóa
 * Từ 2 ký tự, tối đa 8 gợi ý, debounce 300ms phía client (M03-F02).
 * GET /api/v1/search/autocomplete · quyền: công khai
 * Input: keyword (>=2 ký tự)
 * Output: { suggestions: [{ text, type }] }
 */
export function autocompleteKeyword({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M03-02');
  return api.get(endpoint.path, { query });
}

/**
 * API-M03-03 — Từ khóa phổ biến
 * Top từ khóa phổ biến hiển thị khi không có kết quả (M03-F12).
 * GET /api/v1/search/popular-keywords · quyền: công khai
 * Input: limit (tùy chọn)
 * Output: [{ keyword, count }]
 */
export function getPopularKeywords({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M03-03');
  return api.get(endpoint.path, { query });
}

/**
 * API-M03-04 — Thống kê tìm kiếm (Admin)
 * Top từ khóa, từ khóa không có kết quả, tổng lượt tìm (M03-F12).
 * GET /api/v1/search/statistics · quyền: vai trò ADMIN, MARKETING
 * Input: date_from, date_to
 * Output: { top_keywords, zero_result_keywords, total_searches }
 */
export function getSearchStatistics({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M03-04');
  return api.get(endpoint.path, { query });
}
