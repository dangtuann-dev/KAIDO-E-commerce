import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M03-F01) — Chuẩn hóa từ khóa (bỏ dấu, trim, lowercase) và truy vấn chỉ mục (BR-M03-01, BR-M03-02).
 */
export async function searchProducts() {
  throw new NotImplementedError('M03-F01');
}

/**
 * TODO(M03-F02) — Từ 2 ký tự, tối đa 8 gợi ý, debounce 300ms phía client.
 */
export async function autocompleteKeyword() {
  throw new NotImplementedError('M03-F02');
}

/**
 * TODO(M03-F03) — Áp multi-select danh mục/thương hiệu.
 */
export async function applyFacetFilters() {
  throw new NotImplementedError('M03-F03');
}

/**
 * TODO(M03-F04) — Kiểm tra price_min <= price_max, chuẩn hóa VND.
 */
export async function applyPriceFilter() {
  throw new NotImplementedError('M03-F04');
}

/**
 * TODO(M03-F05) — Lọc age_group và gender target.
 */
export async function applyAgeGenderFilter() {
  throw new NotImplementedError('M03-F05');
}

/**
 * TODO(M03-F06) — Lọc còn hàng/đang khuyến mãi.
 */
export async function applyAvailabilityFilter() {
  throw new NotImplementedError('M03-F06');
}

/**
 * TODO(M03-F07) — Áp thứ tự relevance/price/newest/bestselling/name.
 */
export async function sortResults() {
  throw new NotImplementedError('M03-F07');
}

/**
 * TODO(M03-F08) — Mặc định 12 sản phẩm/trang; vượt tổng trang trả trang cuối.
 */
export async function paginateResults() {
  throw new NotImplementedError('M03-F08');
}

/**
 * TODO(M03-F09) — Đếm số lượng theo từng giá trị lọc (facet count).
 */
export async function getFacetCounts() {
  throw new NotImplementedError('M03-F09');
}

/**
 * TODO(M03-F10) — Trả từ khóa phổ biến khi không có kết quả (BR-M03-04).
 */
export async function getNoResultSuggestions() {
  throw new NotImplementedError('M03-F10');
}

/**
 * TODO(M03-F11) — Ghi keyword, bộ lọc, số kết quả; bỏ qua keyword rỗng.
 */
export async function recordSearchHistory() {
  throw new NotImplementedError('M03-F11');
}

/**
 * TODO(M03-F12) — Top N từ khóa phổ biến cho storefront.
 */
export async function getPopularKeywords() {
  throw new NotImplementedError('M03-F12');
}

/**
 * TODO(M03-F12) — Top keyword, keyword không có kết quả, tổng lượt tìm cho admin.
 */
export async function getSearchStatistics() {
  throw new NotImplementedError('M03-F12');
}
