import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCategoryTree,
  getProductDetail,
  getSearchCatalog,
  listProducts,
} from '../service.js';
import * as repo from '../repository.js';

vi.mock('../repository.js', () => ({
  listCategories: vi.fn(),
  listProductRows: vi.fn(),
  findProductByIdOrSlug: vi.fn(),
  listRelatedProductRows: vi.fn(),
  listSearchCatalogRows: vi.fn(),
}));

vi.mock('@/modules/m08-inventory/public.server.js', () => ({
  checkAvailability: vi.fn().mockResolvedValue([]),
}));

const HIDDEN_PARENT = {
  id: 'cat-parent',
  parent_id: null,
  name: 'Đồ chơi cũ',
  slug: 'do-choi-cu',
  sort_order: 1,
  is_active: false,
};

const ACTIVE_CHILD = {
  id: 'cat-child',
  parent_id: HIDDEN_PARENT.id,
  name: 'LEGO cũ',
  slug: 'lego-cu',
  sort_order: 1,
  is_active: true,
};

const ACTIVE_PARENT = {
  id: 'cat-active',
  parent_id: null,
  name: 'LEGO',
  slug: 'lego',
  sort_order: 2,
  is_active: true,
};

function productRow(category) {
  return {
    id: 'product-1',
    name: 'LEGO City',
    slug: 'lego-city',
    status: 'ACTIVE',
    price_regular: 500000,
    price_sale: null,
    sold_count: 0,
    rating_avg: 0,
    rating_count: 0,
    product_categories: [
      { category_id: category.id, is_primary: true, categories: category },
    ],
    product_variants: [{ id: 'variant-1', sku: 'LEGO-01', is_active: true }],
    product_images: [],
    brands: null,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('M02 — danh mục cha bị ẩn', () => {
  it('cây danh mục công khai bỏ con của danh mục cha đang ẩn', async () => {
    repo.listCategories.mockResolvedValue([HIDDEN_PARENT, ACTIVE_CHILD, ACTIVE_PARENT]);

    const tree = await getCategoryTree();

    expect(tree.map((node) => node.slug)).toEqual(['lego']);
  });

  it('danh sách sản phẩm chỉ lọc theo danh mục còn hiệu lực', async () => {
    repo.listCategories.mockResolvedValue([HIDDEN_PARENT, ACTIVE_CHILD, ACTIVE_PARENT]);
    repo.listProductRows.mockResolvedValue({ rows: [], total: 0 });

    await listProducts({ query: {} });

    const filters = repo.listProductRows.mock.calls[0][0];
    expect(filters.categoryIds).toEqual([ACTIVE_PARENT.id]);
  });

  it('chi tiết sản phẩm trong danh mục con của cha bị ẩn trả 404', async () => {
    repo.findProductByIdOrSlug.mockResolvedValue(productRow(ACTIVE_CHILD));
    repo.listCategories.mockResolvedValue([HIDDEN_PARENT, ACTIVE_CHILD]);

    const error = await getProductDetail({ idOrSlug: 'lego-city' }).catch((caught) => caught);

    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(repo.listRelatedProductRows).not.toHaveBeenCalled();
  });

  it('catalog tìm kiếm loại sản phẩm chỉ thuộc danh mục đang ẩn', async () => {
    repo.listCategories.mockResolvedValue([HIDDEN_PARENT, ACTIVE_CHILD, ACTIVE_PARENT]);
    repo.listSearchCatalogRows.mockResolvedValue([
      productRow(ACTIVE_CHILD),
      { ...productRow(ACTIVE_PARENT), id: 'product-2', slug: 'lego-friends' },
    ]);

    const catalog = await getSearchCatalog();

    expect(catalog.map((item) => item.slug)).toEqual(['lego-friends']);
  });
});
