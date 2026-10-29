import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import {
  AGE_GROUP_LABELS,
  GENDER_TARGET_LABELS,
} from '@/shared/constants/product.js';
import { getSearchCatalog } from '@/modules/m02-catalog/public.server.js';
import * as repo from './repository.js';
import {
  AUTOCOMPLETE_CONFIG,
  MAX_SEARCH_KEYWORD_LENGTH,
  SEARCH_AGE_GROUPS,
  SEARCH_GENDERS,
} from './constants.js';

const CATALOG_CACHE_TTL_MS = 15_000;
const STATISTICS_TOP_LIMIT = 10;
const DEFAULT_POPULAR_LIMIT = 10;

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const HTML_TAG = /<[^>]*>/g;

let catalogCache = { entries: null, expiresAt: 0 };

/**
 * Chuẩn hóa văn bản: bỏ HTML, chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng (BR-M03-01).
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  return String(value ?? '')
    .replace(HTML_TAG, ' ')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa từ khóa và giới hạn 100 ký tự (BR-M03-02).
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeKeyword(value) {
  return normalizeText(value).slice(0, MAX_SEARCH_KEYWORD_LENGTH);
}

function indexProduct(product) {
  const name = normalizeText(product.name);
  const brand = normalizeText(product.brand?.name);
  const description = normalizeText(
    [product.short_description, product.description].filter(Boolean).join(' '),
  );
  const skus = (product.sku_list ?? []).map((sku) => normalizeText(sku)).filter(Boolean);

  return {
    product,
    name,
    brand,
    description,
    skus,
    haystack: [name, brand, description, ...skus].filter(Boolean).join(' '),
  };
}

/**
 * BR-M03-06 — điểm phù hợp: tên > thương hiệu > mô tả (SKU chen giữa tên và mô tả).
 * Mọi token của từ khóa phải xuất hiện ở ít nhất một trường thì sản phẩm mới khớp.
 */
function scoreEntry(entry, keyword, tokens) {
  if (!tokens.every((token) => entry.haystack.includes(token))) return 0;

  let score = 0;
  if (entry.name.includes(keyword)) score += 120;
  if (entry.brand && entry.brand.includes(keyword)) score += 50;
  if (entry.skus.some((sku) => sku.includes(keyword))) score += 80;
  if (entry.description.includes(keyword)) score += 25;

  for (const token of tokens) {
    if (entry.name.includes(token)) score += 12;
    if (entry.brand && entry.brand.includes(token)) score += 6;
    if (entry.skus.some((sku) => sku.includes(token))) score += 8;
    if (entry.description.includes(token)) score += 3;
  }

  return score;
}

/**
 * M02 chỉ đọc catalog ACTIVE; cache ngắn để autocomplete không truy vấn lại liên tục.
 * Lỗi M02 được chuyển thành 503 theo NFR-M03-03.
 */
async function loadCatalog() {
  const now = Date.now();
  if (catalogCache.entries && catalogCache.expiresAt > now) return catalogCache.entries;

  try {
    const products = await getSearchCatalog();
    const entries = products.map(indexProduct);
    catalogCache = { entries, expiresAt: now + CATALOG_CACHE_TTL_MS };
    return entries;
  } catch (error) {
    console.warn('[m03:search] Không đọc được catalog M02:', error?.message ?? error);
    throw new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Hệ thống đang bận, vui lòng thử lại sau ít phút.',
      { cause: error },
    );
  }
}

/** Chỉ dùng trong test/dev để bỏ cache catalog. */
export function resetCatalogCache() {
  catalogCache = { entries: null, expiresAt: 0 };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isOnSale(product) {
  const regular = toNumber(product.price_regular);
  const sale = product.price_sale == null ? null : toNumber(product.price_sale);
  return sale != null && sale < regular;
}

/** UNKNOWN (chưa có dữ liệu M08) được coi là còn hàng, giống M02. */
function isInStock(product) {
  return product.stock?.status !== 'OUT_OF_STOCK';
}

function priceOf(product) {
  const regular = toNumber(product.price_regular);
  const sale = product.price_sale == null ? null : toNumber(product.price_sale);
  return sale != null && sale < regular ? sale : regular;
}

/**
 * @param {Record<string, unknown>} query
 */
function createFilterContext(query = {}) {
  return {
    categoryIds: new Set(query.category_id ?? []),
    brandIds: new Set(query.brand_id ?? []),
    priceMin: query.price_min ?? null,
    priceMax: query.price_max ?? null,
    ageGroups: new Set(query.age_group ?? []),
    gender: query.gender ?? null,
    inStock: query.in_stock ?? null,
    onSale: query.on_sale ?? null,
  };
}

/**
 * @param {object} product
 * @param {ReturnType<typeof createFilterContext>} filters
 * @param {string | null} exclude Bỏ qua một facet khi tính count (faceted search).
 */
function matchesFilters(product, filters, exclude = null) {
  if (
    exclude !== 'category' &&
    filters.categoryIds.size > 0 &&
    !(product.category_ids ?? []).some((id) => filters.categoryIds.has(id))
  ) {
    return false;
  }

  if (exclude !== 'brand' && filters.brandIds.size > 0) {
    const brandId = product.brand?.id;
    if (!brandId || !filters.brandIds.has(brandId)) return false;
  }

  if (exclude !== 'price') {
    const price = priceOf(product);
    if (filters.priceMin != null && price < filters.priceMin) return false;
    if (filters.priceMax != null && price > filters.priceMax) return false;
  }

  if (
    exclude !== 'age_group' &&
    filters.ageGroups.size > 0 &&
    !filters.ageGroups.has(product.age_group)
  ) {
    return false;
  }

  if (exclude !== 'gender' && filters.gender && product.gender_target !== filters.gender) {
    return false;
  }

  if (exclude !== 'in_stock' && filters.inStock != null && isInStock(product) !== filters.inStock) {
    return false;
  }

  if (exclude !== 'on_sale' && filters.onSale != null && isOnSale(product) !== filters.onSale) {
    return false;
  }

  return true;
}

function asEntries(items) {
  return items.map((item) => (item && item.product ? item : { product: item, score: 0 }));
}

/* ------------------------------------------------------------------ */
/* Pure filters — M03-F03..F06                                         */
/* ------------------------------------------------------------------ */

/** M03-F03 — multi-select danh mục/thương hiệu. */
export function applyFacetFilters(products, { category_id = [], brand_id = [] } = {}) {
  const categoryIds = new Set(category_id);
  const brandIds = new Set(brand_id);

  return products.filter((product) => {
    if (
      categoryIds.size > 0 &&
      !(product.category_ids ?? []).some((id) => categoryIds.has(id))
    ) {
      return false;
    }
    if (brandIds.size > 0) {
      const brandId = product.brand?.id;
      if (!brandId || !brandIds.has(brandId)) return false;
    }
    return true;
  });
}

/** M03-F04 — khoảng giá VND; price_min <= price_max đã được validation đảm bảo. */
export function applyPriceFilter(products, { price_min, price_max } = {}) {
  return products.filter((product) => {
    const price = priceOf(product);
    if (price_min != null && price < price_min) return false;
    if (price_max != null && price > price_max) return false;
    return true;
  });
}

/** M03-F05 — nhóm tuổi và giới tính. */
export function applyAgeGenderFilter(products, { age_group = [], gender } = {}) {
  const ageGroups = new Set(age_group);

  return products.filter((product) => {
    if (ageGroups.size > 0 && !ageGroups.has(product.age_group)) return false;
    if (gender && product.gender_target !== gender) return false;
    return true;
  });
}

/** M03-F06 — còn hàng/đang khuyến mãi. */
export function applyAvailabilityFilter(products, { in_stock, on_sale } = {}) {
  return products.filter((product) => {
    if (in_stock != null && isInStock(product) !== in_stock) return false;
    if (on_sale != null && isOnSale(product) !== on_sale) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Sorting & pagination — M03-F07, M03-F08                             */
/* ------------------------------------------------------------------ */

function compareName(left, right) {
  return left.product.name.localeCompare(right.product.name, 'vi');
}

function compareCreatedAt(left, right) {
  return new Date(right.product.created_at ?? 0) - new Date(left.product.created_at ?? 0);
}

/** M03-F07 — relevance mặc định; tie-break ổn định theo nổi bật/bán chạy/mới nhất. */
export function sortResults(items, sort = 'relevance') {
  const entries = asEntries(items);

  return [...entries].sort((left, right) => {
    switch (sort) {
      case 'price_asc':
        return priceOf(left.product) - priceOf(right.product) || compareName(left, right);
      case 'price_desc':
        return priceOf(right.product) - priceOf(left.product) || compareName(left, right);
      case 'newest':
        return compareCreatedAt(left, right) || compareName(left, right);
      case 'bestselling':
        return (
          toNumber(right.product.sold_count) - toNumber(left.product.sold_count) ||
          compareName(left, right)
        );
      case 'name_asc':
        return compareName(left, right);
      default:
        return (
          right.score - left.score ||
          Number(Boolean(right.product.is_featured)) - Number(Boolean(left.product.is_featured)) ||
          toNumber(right.product.sold_count) - toNumber(left.product.sold_count) ||
          compareCreatedAt(left, right) ||
          compareName(left, right)
        );
    }
  });
}

/**
 * M03-F08 — mặc định 12/trang; page vượt tổng số trang thì trả trang cuối.
 */
export function paginateResults(items, { page = 1, limit = 12 } = {}) {
  const total = items.length;
  const safeLimit = Math.max(1, toNumber(limit) || 12);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);
  const current = totalPages === 0 ? 1 : Math.min(Math.max(1, toNumber(page) || 1), totalPages);
  const start = (current - 1) * safeLimit;

  return {
    total,
    page: current,
    limit: safeLimit,
    total_pages: totalPages,
    items: items.slice(start, start + safeLimit),
  };
}

/* ------------------------------------------------------------------ */
/* Facet counts — M03-F09                                              */
/* ------------------------------------------------------------------ */

function countCategories(entries) {
  const counts = new Map();

  for (const entry of entries) {
    const seen = new Set();
    for (const category of entry.product.categories ?? []) {
      if (!category?.id || seen.has(category.id)) continue;
      seen.add(category.id);
      const current = counts.get(category.id) ?? {
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: 0,
      };
      current.count += 1;
      counts.set(category.id, current);
    }
  }

  return [...counts.values()].sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name, 'vi'),
  );
}

function countBrands(entries) {
  const counts = new Map();

  for (const entry of entries) {
    const brand = entry.product.brand;
    if (!brand?.id) continue;
    const current = counts.get(brand.id) ?? {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      count: 0,
    };
    current.count += 1;
    counts.set(brand.id, current);
  }

  return [...counts.values()].sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name, 'vi'),
  );
}

function countEnum(entries, field, values, labels) {
  const counts = new Map(values.map((value) => [value, 0]));

  for (const entry of entries) {
    const value = entry.product[field];
    if (counts.has(value)) counts.set(value, counts.get(value) + 1);
  }

  return values
    .map((value) => ({ value, label: labels[value], count: counts.get(value) }))
    .filter((item) => item.count > 0);
}

function countBoolean(entries, predicate, trueLabel, falseLabel) {
  let truthy = 0;

  for (const entry of entries) {
    if (predicate(entry.product)) truthy += 1;
  }

  return [
    { value: true, label: trueLabel, count: truthy },
    { value: false, label: falseLabel, count: entries.length - truthy },
  ];
}

function priceRange(entries) {
  if (entries.length === 0) return { min: 0, max: 0 };

  let min = Infinity;
  let max = 0;

  for (const entry of entries) {
    const price = priceOf(entry.product);
    if (price < min) min = price;
    if (price > max) max = price;
  }

  return { min: Number.isFinite(min) ? min : 0, max };
}

/**
 * M03-F09 — với mỗi facet, đếm trên tập đã lọc bởi mọi facet khác (trừ chính nó).
 * @param {Array<object>} items Sản phẩm hoặc entry { product, score }.
 * @param {ReturnType<typeof createFilterContext>} filters
 */
export function getFacetCounts(items, filters = createFilterContext()) {
  const entries = asEntries(items);
  const pool = (exclude) => entries.filter((entry) => matchesFilters(entry.product, filters, exclude));

  return {
    category: countCategories(pool('category')),
    brand: countBrands(pool('brand')),
    price: priceRange(pool('price')),
    age_group: countEnum(pool('age_group'), 'age_group', SEARCH_AGE_GROUPS, AGE_GROUP_LABELS),
    gender: countEnum(pool('gender'), 'gender_target', SEARCH_GENDERS, GENDER_TARGET_LABELS),
    in_stock: countBoolean(pool('in_stock'), isInStock, 'Còn hàng', 'Hết hàng'),
    on_sale: countBoolean(pool('on_sale'), isOnSale, 'Đang khuyến mãi', 'Giá thường'),
  };
}

/* ------------------------------------------------------------------ */
/* History & suggestions — M03-F10..F12                                */
/* ------------------------------------------------------------------ */

function aggregateKeywords(rows) {
  const counts = new Map();

  for (const row of rows) {
    const key = row.normalized_keyword;
    if (!key) continue;
    const current = counts.get(key) ?? { keyword: row.keyword, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }

  return [...counts.values()].sort(
    (left, right) => right.count - left.count || left.keyword.localeCompare(right.keyword, 'vi'),
  );
}

/**
 * M03-F11 — ghi keyword hợp lệ; bỏ qua keyword rỗng hoặc không có actor.
 * Lỗi ghi lịch sử không được làm hỏng kết quả tìm kiếm.
 */
export async function recordSearchHistory({
  keyword,
  normalizedKeyword,
  resultCount,
  userId = null,
  guestSessionId = null,
}) {
  const normalized = normalizedKeyword ?? normalizeKeyword(keyword);
  if (!normalized) return { recorded: false, reason: 'empty_keyword' };
  if (!userId && !guestSessionId) return { recorded: false, reason: 'no_actor' };

  const displayKeyword = String(keyword ?? '').trim().slice(0, MAX_SEARCH_KEYWORD_LENGTH);

  try {
    await repo.insertSearchHistory({
      user_id: userId,
      guest_session_id: userId ? null : guestSessionId,
      keyword: displayKeyword,
      normalized_keyword: normalized,
      result_count: Math.max(0, toNumber(resultCount)),
    });
    return { recorded: true };
  } catch (error) {
    console.warn('[m03:search] Không ghi được lịch sử tìm kiếm:', error?.message ?? error);
    return { recorded: false, reason: 'write_failed' };
  }
}

/** M03-F12 — top từ khóa phổ biến (storefront); lỗi DB trả rỗng để không chặn UI. */
export async function getPopularKeywords({ query = {} } = {}) {
  const limit = Math.max(1, toNumber(query.limit) || DEFAULT_POPULAR_LIMIT);

  try {
    const rows = await repo.listSearchHistoryRows();
    return aggregateKeywords(rows).slice(0, limit);
  } catch (error) {
    console.warn('[m03:search] Không đọc được từ khóa phổ biến:', error?.message ?? error);
    return [];
  }
}

/** M03-F10 — gợi ý khi không có kết quả: từ khóa phổ biến. */
export async function getNoResultSuggestions({ limit = DEFAULT_POPULAR_LIMIT } = {}) {
  return getPopularKeywords({ query: { limit } });
}

function resolveRange({ date_from: dateFrom, date_to: dateTo } = {}) {
  const since = dateFrom ? new Date(dateFrom) : null;
  let until = dateTo ? new Date(dateTo) : null;

  if (until && /^\d{4}-\d{2}-\d{2}$/.test(String(dateTo))) {
    until = new Date(`${dateTo}T23:59:59.999Z`);
  }

  return {
    since: since && !Number.isNaN(since.getTime()) ? since.toISOString() : undefined,
    until: until && !Number.isNaN(until.getTime()) ? until.toISOString() : undefined,
  };
}

/** M03-F12 — thống kê cho admin: tổng lượt, top từ khóa, từ khóa không có kết quả. */
export async function getSearchStatistics({ query = {} } = {}) {
  const range = resolveRange(query);
  const [rows, totalSearches] = await Promise.all([
    repo.listSearchHistoryRows(range),
    repo.countSearchRows(range),
  ]);

  const zeroRows = rows.filter((row) => toNumber(row.result_count) === 0);

  return {
    total_searches: totalSearches,
    top_keywords: aggregateKeywords(rows).slice(0, STATISTICS_TOP_LIMIT),
    zero_result_keywords: aggregateKeywords(zeroRows).slice(0, STATISTICS_TOP_LIMIT),
  };
}

/* ------------------------------------------------------------------ */
/* Public service — M03-F01, M03-F02                                   */
/* ------------------------------------------------------------------ */

/**
 * M03-F01 — faceted search trên catalog ACTIVE của M02 (BR-M03-01..07).
 * @param {{ query?: Record<string, unknown>, userId?: string | null, guestSessionId?: string | null }} input
 */
export async function searchProducts({ query = {}, userId = null, guestSessionId = null } = {}) {
  const keyword = normalizeKeyword(query.keyword);
  const tokens = keyword ? keyword.split(' ').filter(Boolean) : [];
  const entries = await loadCatalog();

  const matched = [];
  for (const entry of entries) {
    const score = keyword ? scoreEntry(entry, keyword, tokens) : 0;
    if (!keyword || score > 0) matched.push({ ...entry, score });
  }

  const filters = createFilterContext(query);
  const filtered = matched.filter((entry) => matchesFilters(entry.product, filters));
  const sorted = sortResults(filtered, query.sort ?? 'relevance');
  const paged = paginateResults(sorted, { page: query.page, limit: query.limit });

  const facets = getFacetCounts(matched, filters);

  // Chỉ ghi lượt tìm đầu tiên để phân trang không thổi phồng thống kê.
  if (keyword && paged.page === 1) {
    await recordSearchHistory({
      keyword: query.keyword,
      normalizedKeyword: keyword,
      resultCount: filtered.length,
      userId,
      guestSessionId,
    });
  }

  return {
    keyword: String(query.keyword ?? '').trim().slice(0, MAX_SEARCH_KEYWORD_LENGTH) || null,
    total: paged.total,
    page: paged.page,
    limit: paged.limit,
    total_pages: paged.total_pages,
    results: paged.items.map((entry) => entry.product),
    facets,
  };
}

const SUGGESTION_TYPE_ORDER = { category: 0, brand: 1, product: 2 };

function buildSuggestions(entries, keyword) {
  const candidates = [];
  const seen = new Set();

  const push = (text, type, score) => {
    const clean = String(text ?? '').trim();
    if (!clean) return;
    const key = normalizeText(clean);
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push({ text: clean, type, score });
  };

  for (const entry of entries) {
    for (const category of entry.product.categories ?? []) {
      const normalized = normalizeText(category.name);
      if (normalized.startsWith(keyword)) push(category.name, 'category', 3);
      else if (normalized.includes(keyword)) push(category.name, 'category', 1);
    }
    if (entry.brand) {
      if (entry.brand.startsWith(keyword)) push(entry.product.brand.name, 'brand', 3);
      else if (entry.brand.includes(keyword)) push(entry.product.brand.name, 'brand', 1);
    }
    if (entry.name.startsWith(keyword)) push(entry.product.name, 'product', 2);
    else if (entry.name.includes(keyword)) push(entry.product.name, 'product', 0);
  }

  return candidates
    .sort(
      (left, right) =>
        right.score - left.score ||
        SUGGESTION_TYPE_ORDER[left.type] - SUGGESTION_TYPE_ORDER[right.type] ||
        left.text.length - right.text.length ||
        left.text.localeCompare(right.text, 'vi'),
    )
    .slice(0, AUTOCOMPLETE_CONFIG.maxResults)
    .map(({ text, type }) => ({ text, type }));
}

/** M03-F02 — gợi ý từ 2 ký tự, tối đa 8 kết quả (debounce 300ms phía client). */
export async function autocompleteKeyword({ query = {} } = {}) {
  const keyword = normalizeKeyword(query.keyword);
  if (keyword.length < AUTOCOMPLETE_CONFIG.minChars) return { suggestions: [] };

  const entries = await loadCatalog();
  return { suggestions: buildSuggestions(entries, keyword) };
}
