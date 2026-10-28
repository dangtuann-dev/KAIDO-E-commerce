/**
 * [TOY-M02] Sản phẩm và danh mục — ProductListPage
 * SRS: M02-F10, M02-F01 | API: API-M02-02, API-M02-01, API-M02-10
 * Route: /products
 * Render: Server Component (SEO) + Client filters.
 * PLP mặc định 12 sản phẩm/trang, URL phân trang chuẩn SEO (M02-F10).
 */
import Link from 'next/link';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import ProductCard from '../components/ProductCard.jsx';
import CatalogFilters from '../components/CatalogFilters.jsx';
import CatalogPagination from '../components/CatalogPagination.jsx';
import { getCategoryTree, listBrands, listProducts } from '../../server/service.js';

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Tất cả sản phẩm',
  description:
    'Khám phá đồ chơi trẻ em chính hãng tại KAIDO: bộ lắp ráp, đồ chơi giáo dục, thú bông và đồ chơi vận động.',
  alternates: { canonical: '/products' },
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCatalogQuery(searchParams = {}) {
  const pageNumber = Number(firstValue(searchParams.page));
  const sort = firstValue(searchParams.sort);
  const allowedSorts = ['relevance', 'price_asc', 'price_desc', 'newest', 'bestselling', 'name_asc'];

  return {
    page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    limit: PAGE_SIZE,
    sort: allowedSorts.includes(sort) ? sort : undefined,
    category_slug: firstValue(searchParams.category_slug)?.trim() || undefined,
    brand_slug: firstValue(searchParams.brand_slug)?.trim() || undefined,
    keyword: firstValue(searchParams.keyword)?.trim().slice(0, 100) || undefined,
  };
}

async function loadCatalog() {
  try {
    const [categories, brands] = await Promise.all([getCategoryTree(), listBrands()]);
    return { categories, brands, error: null };
  } catch (error) {
    console.warn('[m02:storefront] Không tải được danh mục/thương hiệu:', error?.message ?? error);
    return { categories: [], brands: [], error: null };
  }
}

export default async function ProductListPage({ searchParams }) {
  const resolvedParams = (await searchParams) ?? {};
  const query = parseCatalogQuery(resolvedParams);
  const [{ categories, brands }, result] = await Promise.all([
    loadCatalog(),
    listProducts({ query }).catch((error) => {
      console.warn('[m02:storefront] Không tải được sản phẩm:', error?.message ?? error);
      return null;
    }),
  ]);

  const activeFilters = [
    resolvedParams.keyword ? `từ khóa “${firstValue(resolvedParams.keyword)}”` : null,
    resolvedParams.brand_slug ? 'thương hiệu đã chọn' : null,
    resolvedParams.category_slug ? 'danh mục đã chọn' : null,
  ].filter(Boolean);

  return (
    <div className="kaido-container py-8 md:py-10">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Sản phẩm' }]} />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Tất cả sản phẩm</h1>
          <p className="mt-1 text-body-s text-slate">
            {result
              ? `${result.total} sản phẩm${activeFilters.length ? ` · ${activeFilters.join(', ')}` : ''}`
              : 'Danh sách sản phẩm đang được cập nhật.'}
          </p>
        </div>
        <Link
          href="/products?sort=newest"
          className="hidden text-body-s font-semibold text-primary md:inline"
        >
          Hàng mới về
        </Link>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <CatalogFilters categories={categories} brands={brands} />

        <section aria-label="Danh sách sản phẩm">
          {!result ? (
            <EmptyState
              title="Chưa tải được sản phẩm"
              description="Hệ thống đang bận hoặc mất kết nối dữ liệu. Vui lòng thử lại sau ít phút."
            />
          ) : result.items.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác."
              action={
                <Link
                  href="/products"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
                >
                  Xem tất cả sản phẩm
                </Link>
              }
            />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.items.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard product={product} priority={index < 4} />
                  </li>
                ))}
              </ul>

              <CatalogPagination
                basePath="/products"
                searchParams={resolvedParams}
                page={result.page}
                totalPages={result.total_pages}
                className="mt-8"
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
