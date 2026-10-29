import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/m02-catalog/public.server.js', () => ({
  getSearchCatalog: vi.fn(),
}));

vi.mock('../repository.js', () => ({
  insertSearchHistory: vi.fn(),
  listSearchHistoryRows: vi.fn(),
  countSearchRows: vi.fn(),
}));

import { getSearchCatalog } from '@/modules/m02-catalog/public.server.js';
import { getEndpointsByModule } from '@/shared/api-endpoints.js';
import * as repo from '../repository.js';
import { handlers } from '../handlers.js';
import { validationSchemas } from '../validation.js';
import {
  applyAgeGenderFilter,
  applyAvailabilityFilter,
  applyFacetFilters,
  applyPriceFilter,
  autocompleteKeyword,
  getFacetCounts,
  getPopularKeywords,
  getSearchStatistics,
  normalizeKeyword,
  paginateResults,
  recordSearchHistory,
  resetCatalogCache,
  searchProducts,
  sortResults,
} from '../service.js';
import { getPopularSearchTerms, searchCatalogIndex } from '../../public.server.js';

const API_CODES = getEndpointsByModule('M03').map((endpoint) => endpoint.code);
const GUEST_ID = 'guest-session-0001';

const CATEGORY_XE = { id: '11111111-1111-4111-8111-111111111111', name: 'Xe đạp', slug: 'xe-dap' };
const CATEGORY_BUP = { id: '22222222-2222-4222-8222-222222222222', name: 'Búp bê', slug: 'bup-be' };
const BRAND_KAIDO = { id: '33333333-3333-4333-8333-333333333333', name: 'KAIDO', slug: 'kaido' };
const BRAND_SANGTAO = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Sáng Tạo',
  slug: 'sang-tao',
};

let sequence = 0;

function makeProduct(overrides = {}) {
  sequence += 1;
  const categories = overrides.categories ?? [CATEGORY_XE];

  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    name: `Sản phẩm ${sequence}`,
    slug: `san-pham-${sequence}`,
    short_description: null,
    description: null,
    status: 'ACTIVE',
    age_group: '3-6Y',
    gender_target: 'UNISEX',
    price_regular: 500_000,
    price_sale: null,
    price: 500_000,
    brand: BRAND_KAIDO,
    category: categories[0] ?? null,
    categories,
    category_ids: categories.map((category) => category.id),
    thumbnail_url: null,
    thumbnail_alt: null,
    variants_count: 1,
    default_sku: null,
    sku_list: [],
    rating_avg: 0,
    rating_count: 0,
    sold_count: 0,
    is_featured: false,
    stock: { status: 'IN_STOCK', available: 10 },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function useCatalog(products) {
  getSearchCatalog.mockResolvedValue(products);
  resetCatalogCache();
}

beforeEach(() => {
  vi.clearAllMocks();
  resetCatalogCache();
  getSearchCatalog.mockResolvedValue([]);
  repo.insertSearchHistory.mockResolvedValue({ id: 1 });
  repo.listSearchHistoryRows.mockResolvedValue([]);
  repo.countSearchRows.mockResolvedValue(0);
});

describe('M03 — chuẩn hóa từ khóa (BR-M03-01, BR-M03-02)', () => {
  it('bỏ dấu, chữ thường, khoảng trắng thừa và HTML', () => {
    expect(normalizeKeyword('  Xe ĐẠP <b>trẻ</b>   em ')).toBe('xe dap tre em');
  });

  it('giới hạn 100 ký tự', () => {
    expect(normalizeKeyword('a'.repeat(150))).toHaveLength(100);
  });

  it('trả chuỗi rỗng với đầu vào không hợp lệ', () => {
    expect(normalizeKeyword(null)).toBe('');
    expect(normalizeKeyword('   ')).toBe('');
  });
});

describe('M03 — tìm kiếm và xếp hạng (BR-M03-06)', () => {
  it('xếp tên > thương hiệu > mô tả', async () => {
    useCatalog([
      makeProduct({
        name: 'Bộ xếp hình sáng tạo',
        categories: [CATEGORY_BUP],
        description: 'Đồ chơi ghép hình',
      }),
      makeProduct({
        name: 'Đồ chơi gỗ',
        brand: BRAND_SANGTAO,
        categories: [CATEGORY_BUP],
        description: 'Đồ chơi ghép hình',
      }),
      makeProduct({
        name: 'Đồ chơi gỗ',
        categories: [CATEGORY_BUP],
        description: 'Bộ xếp hình sáng tạo cho bé',
      }),
    ]);

    const result = await searchProducts({ query: { keyword: 'sáng tạo' } });
    expect(result.total).toBe(3);
    expect(result.results[0].name).toBe('Bộ xếp hình sáng tạo');
    expect(result.results[1].brand.id).toBe(BRAND_SANGTAO.id);
    expect(result.results[2].name).toBe('Đồ chơi gỗ');
  });

  it('khớp theo SKU không dấu và bỏ qua sản phẩm không khớp', async () => {
    useCatalog([
      makeProduct({ name: 'Xe đạp', sku_list: ['XE-DAP-001'] }),
      makeProduct({ name: 'Búp bê', sku_list: ['BUP-BE-001'] }),
    ]);

    const result = await searchProducts({ query: { keyword: 'xe dap' } });
    expect(result.total).toBe(1);
    expect(result.results[0].name).toBe('Xe đạp');
  });

  it('từ khóa rỗng trả toàn bộ catalog ACTIVE', async () => {
    useCatalog([makeProduct(), makeProduct()]);
    const result = await searchProducts({ query: {} });
    expect(result.total).toBe(2);
  });

  it('không gọi lại M02 trong thời gian cache', async () => {
    useCatalog([makeProduct()]);
    await searchProducts({ query: {} });
    await searchProducts({ query: { keyword: 'san pham' } });
    expect(getSearchCatalog).toHaveBeenCalledTimes(1);
  });

  it('M02 lỗi trả SERVICE_UNAVAILABLE (NFR-M03-03)', async () => {
    getSearchCatalog.mockRejectedValue(new Error('fetch failed'));
    resetCatalogCache();

    await expect(searchProducts({ query: {} })).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
    });
  });
});

describe('M03 — bộ lọc (M03-F03..F06)', () => {
  const catalog = [
    makeProduct({
      name: 'Xe đạp bé trai',
      categories: [CATEGORY_XE],
      brand: BRAND_KAIDO,
      price_regular: 300_000,
      price: 300_000,
      age_group: '3-6Y',
      gender_target: 'BOY',
      stock: { status: 'IN_STOCK', available: 2 },
    }),
    makeProduct({
      name: 'Xe đạp bé gái',
      categories: [CATEGORY_XE, CATEGORY_BUP],
      brand: BRAND_SANGTAO,
      price_regular: 900_000,
      price_sale: 600_000,
      price: 600_000,
      age_group: '6-12Y',
      gender_target: 'GIRL',
      stock: { status: 'OUT_OF_STOCK', available: 0 },
    }),
    makeProduct({
      name: 'Búp bê vải',
      categories: [CATEGORY_BUP],
      brand: BRAND_SANGTAO,
      price_regular: 150_000,
      price: 150_000,
      age_group: '1-3Y',
      gender_target: 'GIRL',
      stock: { status: 'UNKNOWN', available: null },
    }),
  ];

  it('lọc multi-select danh mục/thương hiệu', () => {
    expect(applyFacetFilters(catalog, { category_id: [CATEGORY_BUP.id] })).toHaveLength(2);
    expect(
      applyFacetFilters(catalog, { brand_id: [BRAND_SANGTAO.id], category_id: [CATEGORY_XE.id] }),
    ).toHaveLength(1);
  });

  it('lọc khoảng giá theo giá bán', () => {
    expect(applyPriceFilter(catalog, { price_min: 200_000, price_max: 700_000 })).toHaveLength(2);
    expect(applyPriceFilter(catalog, { price_max: 200_000 })).toHaveLength(1);
  });

  it('lọc tuổi và giới tính', () => {
    expect(applyAgeGenderFilter(catalog, { age_group: ['6-12Y'] })).toHaveLength(1);
    expect(applyAgeGenderFilter(catalog, { gender: 'GIRL' })).toHaveLength(2);
  });

  it('lọc còn hàng/khuyến mãi; UNKNOWN được coi là còn hàng', () => {
    expect(applyAvailabilityFilter(catalog, { in_stock: true })).toHaveLength(2);
    expect(applyAvailabilityFilter(catalog, { in_stock: false })).toHaveLength(1);
    expect(applyAvailabilityFilter(catalog, { on_sale: true })).toHaveLength(1);
  });

  it('áp dụng đồng thời nhiều bộ lọc', async () => {
    useCatalog(catalog);
    const result = await searchProducts({
      query: { keyword: 'xe', gender: 'GIRL', on_sale: true, price_max: 700_000 },
    });

    expect(result.total).toBe(1);
    expect(result.results[0].name).toBe('Xe đạp bé gái');
  });

  it('bộ lọc rỗng trả tất cả', async () => {
    useCatalog(catalog);
    const result = await searchProducts({ query: {} });
    expect(result.total).toBe(3);
  });
});

describe('M03 — facet count (M03-F09)', () => {
  it('đếm danh mục/thương hiệu/tuổi/giới tính và khoảng giá thực tế', async () => {
    useCatalog([
      makeProduct({
        name: 'Xe đạp',
        categories: [CATEGORY_XE],
        brand: BRAND_KAIDO,
        price_regular: 200_000,
        price: 200_000,
        age_group: '3-6Y',
        gender_target: 'BOY',
        stock: { status: 'IN_STOCK', available: 1 },
      }),
      makeProduct({
        name: 'Búp bê',
        categories: [CATEGORY_BUP],
        brand: BRAND_SANGTAO,
        price_regular: 800_000,
        price_sale: 500_000,
        price: 500_000,
        age_group: '6-12Y',
        gender_target: 'GIRL',
        stock: { status: 'OUT_OF_STOCK', available: 0 },
      }),
    ]);

    const result = await searchProducts({ query: {} });

    expect(result.facets.category).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: CATEGORY_XE.id, count: 1 }),
        expect.objectContaining({ id: CATEGORY_BUP.id, count: 1 }),
      ]),
    );
    expect(result.facets.brand.find((item) => item.id === BRAND_KAIDO.id)?.count).toBe(1);
    expect(result.facets.age_group).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: '3-6Y', count: 1 })]),
    );
    expect(result.facets.gender).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'GIRL', count: 1 })]),
    );
    expect(result.facets.in_stock).toEqual([
      { value: true, label: 'Còn hàng', count: 1 },
      { value: false, label: 'Hết hàng', count: 1 },
    ]);
    expect(result.facets.on_sale.find((item) => item.value === true)?.count).toBe(1);
    expect(result.facets.price).toEqual({ min: 200_000, max: 500_000 });
  });

  it('count của facet bỏ qua chính bộ lọc đó nhưng vẫn áp dụng bộ lọc khác', async () => {
    useCatalog([
      makeProduct({ categories: [CATEGORY_XE], age_group: '3-6Y', brand: BRAND_KAIDO }),
      makeProduct({ categories: [CATEGORY_BUP], age_group: '6-12Y', brand: BRAND_KAIDO }),
    ]);

    const result = await searchProducts({
      query: { category_id: [CATEGORY_XE.id], brand_id: [BRAND_KAIDO.id] },
    });

    expect(result.total).toBe(1);
    // Bỏ lọc danh mục: cả hai đều cùng thương hiệu nên facet danh mục có count 1 mỗi danh mục.
    expect(result.facets.category).toHaveLength(2);
  });

  it('hỗ trợ gọi trực tiếp với danh sách sản phẩm', () => {
    const product = makeProduct({ categories: [CATEGORY_XE] });
    const facets = getFacetCounts([product], {
      categoryIds: new Set(),
      brandIds: new Set(),
      priceMin: null,
      priceMax: null,
      ageGroups: new Set(),
      gender: null,
      inStock: null,
      onSale: null,
    });

    expect(facets.category[0]).toMatchObject({ id: CATEGORY_XE.id, count: 1 });
  });
});

describe('M03 — sắp xếp và phân trang (M03-F07, M03-F08)', () => {
  function entries() {
    return [
      { product: makeProduct({ name: 'B', price_regular: 300, price: 300, sold_count: 5 }), score: 1 },
      { product: makeProduct({ name: 'A', price_regular: 100, price: 100, sold_count: 9 }), score: 3 },
      { product: makeProduct({ name: 'C', price_regular: 200, price: 200, sold_count: 1 }), score: 2 },
    ];
  }

  it('sắp xếp giá tăng/giảm, bán chạy, tên A-Z', () => {
    expect(sortResults(entries(), 'price_asc').map((item) => item.product.name)).toEqual([
      'A',
      'C',
      'B',
    ]);
    expect(sortResults(entries(), 'price_desc').map((item) => item.product.name)).toEqual([
      'B',
      'C',
      'A',
    ]);
    expect(sortResults(entries(), 'bestselling').map((item) => item.product.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(sortResults(entries(), 'name_asc').map((item) => item.product.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('relevance ưu tiên điểm phù hợp', () => {
    expect(sortResults(entries(), 'relevance').map((item) => item.product.name)).toEqual([
      'A',
      'C',
      'B',
    ]);
  });

  it('mặc định 12/trang và trang vượt tổng trả trang cuối', () => {
    const items = Array.from({ length: 15 }, () => ({ product: makeProduct(), score: 0 }));
    const first = paginateResults(items, { page: 1, limit: 12 });
    expect(first).toMatchObject({ total: 15, page: 1, total_pages: 2 });
    expect(first.items).toHaveLength(12);

    const overflow = paginateResults(items, { page: 9, limit: 12 });
    expect(overflow).toMatchObject({ page: 2, total_pages: 2 });
    expect(overflow.items).toHaveLength(3);

    expect(paginateResults([], { page: 3, limit: 12 })).toMatchObject({
      total: 0,
      page: 1,
      total_pages: 0,
    });
  });

  it('sắp xếp và phân trang qua API', async () => {
    useCatalog([
      makeProduct({ name: 'Xe A', price_regular: 300_000, price: 300_000 }),
      makeProduct({ name: 'Xe B', price_regular: 100_000, price: 100_000 }),
    ]);

    const result = await searchProducts({ query: { keyword: 'xe', sort: 'price_asc' } });
    expect(result.results.map((item) => item.name)).toEqual(['Xe B', 'Xe A']);
  });
});

describe('M03 — autocomplete (M03-F02)', () => {
  it('yêu cầu tối thiểu 2 ký tự', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);
    await expect(autocompleteKeyword({ query: { keyword: 'x' } })).resolves.toEqual({
      suggestions: [],
    });
    expect(getSearchCatalog).not.toHaveBeenCalled();
  });

  it('gợi ý sản phẩm, thương hiệu, danh mục và tối đa 8 kết quả', async () => {
    const products = Array.from({ length: 12 }, (_, index) =>
      makeProduct({ name: `Xe đạp mẫu ${index}`, categories: [CATEGORY_XE] }),
    );
    useCatalog(products);

    const { suggestions } = await autocompleteKeyword({ query: { keyword: 'xe' } });
    expect(suggestions.length).toBeLessThanOrEqual(8);
    expect(suggestions[0]).toEqual({ text: 'Xe đạp', type: 'category' });
    expect(suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'product' })]),
    );
  });

  it('gợi ý thương hiệu khi từ khóa khớp', async () => {
    useCatalog([makeProduct({ name: 'Búp bê' })]);
    const { suggestions } = await autocompleteKeyword({ query: { keyword: 'kai' } });
    expect(suggestions).toEqual([{ text: 'KAIDO', type: 'brand' }]);
  });

  it('so khớp không dấu', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);
    const { suggestions } = await autocompleteKeyword({ query: { keyword: 'xe dap' } });
    expect(suggestions).toEqual([{ text: 'Xe đạp', type: 'category' }]);
  });
});

describe('M03 — lịch sử tìm kiếm (M03-F11)', () => {
  it('ghi keyword cho khách có guest session', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);

    await searchProducts({
      query: { keyword: 'Xe đạp' },
      guestSessionId: GUEST_ID,
    });

    expect(repo.insertSearchHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        guest_session_id: GUEST_ID,
        keyword: 'Xe đạp',
        normalized_keyword: 'xe dap',
        result_count: 1,
      }),
    );
  });

  it('ưu tiên user_id khi đã đăng nhập', async () => {
    useCatalog([]);
    await searchProducts({
      query: { keyword: 'xe' },
      userId: 'user-1',
      guestSessionId: GUEST_ID,
    });

    expect(repo.insertSearchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', guest_session_id: null }),
    );
  });

  it('không ghi khi không có actor, keyword rỗng hoặc sang trang', async () => {
    useCatalog(
      Array.from({ length: 13 }, (_, index) => makeProduct({ name: `Xe đạp ${index}` })),
    );

    await searchProducts({ query: { keyword: 'xe' } });
    await searchProducts({ query: {}, guestSessionId: GUEST_ID });
    await searchProducts({ query: { keyword: 'xe', page: 2 }, guestSessionId: GUEST_ID });

    expect(repo.insertSearchHistory).not.toHaveBeenCalled();
  });

  it('lỗi ghi lịch sử không làm hỏng tìm kiếm', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);
    repo.insertSearchHistory.mockRejectedValue(new Error('db down'));

    const result = await searchProducts({
      query: { keyword: 'xe' },
      guestSessionId: GUEST_ID,
    });
    expect(result.total).toBe(1);
  });

  it('bỏ qua keyword rỗng và không có actor', async () => {
    await expect(recordSearchHistory({ keyword: '   ' })).resolves.toEqual({
      recorded: false,
      reason: 'empty_keyword',
    });
    await expect(recordSearchHistory({ keyword: 'xe' })).resolves.toEqual({
      recorded: false,
      reason: 'no_actor',
    });
  });
});

describe('M03 — từ khóa phổ biến và thống kê (M03-F12)', () => {
  const rows = [
    { keyword: 'Xe đạp', normalized_keyword: 'xe dap', result_count: 3 },
    { keyword: 'Xe đạp', normalized_keyword: 'xe dap', result_count: 1 },
    { keyword: 'Búp bê', normalized_keyword: 'bup be', result_count: 0 },
  ];

  it('gộp theo normalized keyword và tôn trọng limit', async () => {
    repo.listSearchHistoryRows.mockResolvedValue(rows);

    await expect(getPopularKeywords({ query: { limit: 1 } })).resolves.toEqual([
      { keyword: 'Xe đạp', count: 2 },
    ]);
  });

  it('trả rỗng khi đọc lịch sử lỗi', async () => {
    repo.listSearchHistoryRows.mockRejectedValue(new Error('db down'));
    await expect(getPopularKeywords({ query: {} })).resolves.toEqual([]);
  });

  it('thống kê tổng lượt, top keyword và keyword không có kết quả', async () => {
    repo.listSearchHistoryRows.mockResolvedValue(rows);
    repo.countSearchRows.mockResolvedValue(3);

    const stats = await getSearchStatistics({ query: {} });
    expect(stats.total_searches).toBe(3);
    expect(stats.top_keywords[0]).toEqual({ keyword: 'Xe đạp', count: 2 });
    expect(stats.zero_result_keywords).toEqual([{ keyword: 'Búp bê', count: 1 }]);
  });

  it('mở rộng date_to đến hết ngày', async () => {
    repo.listSearchHistoryRows.mockResolvedValue([]);
    repo.countSearchRows.mockResolvedValue(0);

    await getSearchStatistics({
      query: { date_from: '2026-10-01', date_to: '2026-10-05' },
    });

    expect(repo.listSearchHistoryRows).toHaveBeenCalledWith({
      since: '2026-10-01T00:00:00.000Z',
      until: '2026-10-05T23:59:59.999Z',
    });
  });
});

describe('M03 — hợp đồng public.server.js', () => {
  it('searchCatalogIndex tái sử dụng tìm kiếm nội bộ', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);
    const result = await searchCatalogIndex({ query: { keyword: 'xe' } });
    expect(result.total).toBe(1);
  });

  it('getPopularSearchTerms trả mảng keyword/count', async () => {
    repo.listSearchHistoryRows.mockResolvedValue([
      { keyword: 'Xe đạp', normalized_keyword: 'xe dap', result_count: 1 },
    ]);
    await expect(getPopularSearchTerms(5)).resolves.toEqual([{ keyword: 'Xe đạp', count: 1 }]);
    expect(repo.listSearchHistoryRows).toHaveBeenCalled();
  });
});

describe('M03 — handlers và validation', () => {
  it('có handler cho mọi API trong registry', () => {
    expect(Object.keys(handlers).sort()).toEqual([...API_CODES].sort());
  });

  it('handler API-M03-01 truyền actor và trả kết quả', async () => {
    useCatalog([makeProduct({ name: 'Xe đạp' })]);

    const result = await handlers['API-M03-01']({
      query: { keyword: 'xe' },
      auth: null,
      guestSessionId: GUEST_ID,
    });

    expect(result.total).toBe(1);
    expect(repo.insertSearchHistory).toHaveBeenCalled();
  });

  it('validationSchemas chỉ khai báo API của module', () => {
    expect(Object.keys(validationSchemas).sort()).toEqual(
      ['API-M03-01', 'API-M03-02', 'API-M03-03', 'API-M03-04'].sort(),
    );
  });

  it('parse CSV, mặc định và kiểm tra khoảng giá', () => {
    const schema = validationSchemas['API-M03-01'].query;
    const parsed = schema.parse({
      category_id: `${CATEGORY_XE.id}, ${CATEGORY_BUP.id}`,
      age_group: '3-6Y,6-12Y',
      page: '2',
    });

    expect(parsed.category_id).toEqual([CATEGORY_XE.id, CATEGORY_BUP.id]);
    expect(parsed.age_group).toEqual(['3-6Y', '6-12Y']);
    expect(parsed).toMatchObject({ page: 2, limit: 12, sort: 'relevance' });

    expect(schema.safeParse({ price_min: 500, price_max: 100 }).success).toBe(false);
    expect(schema.safeParse({ keyword: 'a'.repeat(101) }).success).toBe(false);
  });

  it('autocomplete yêu cầu >= 2 ký tự', () => {
    const schema = validationSchemas['API-M03-02'].query;
    expect(schema.safeParse({ keyword: 'x' }).success).toBe(false);
    expect(schema.safeParse({ keyword: 'xe' }).success).toBe(true);
  });

  it('thống kê từ chối khoảng ngày đảo ngược', () => {
    const schema = validationSchemas['API-M03-04'].query;
    expect(schema.safeParse({ date_from: '2026-10-05', date_to: '2026-10-01' }).success).toBe(
      false,
    );
  });
});
