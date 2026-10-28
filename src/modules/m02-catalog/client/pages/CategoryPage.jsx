/**
 * [TOY-M02] Sản phẩm và danh mục — CategoryPage
 * SRS: M02-F01, M02-F10 | API: API-M02-01, API-M02-02, API-M02-10
 * Route: /category/[slug]
 * Render: Server Component (SEO) + Client filters.
 * Danh mục cha hiển thị toàn bộ sản phẩm của cây con (BR-M02-04).
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import ProductCard from '../components/ProductCard.jsx';
import CatalogFilters from '../components/CatalogFilters.jsx';
import CatalogPagination from '../components/CatalogPagination.jsx';
import { parseCatalogQuery } from './ProductListPage.jsx';
import { getCategoryTree, listBrands, listProducts } from '../../server/service.js';

export const loadCategory = cache(async (slug) => {
  const tree = await getCategoryTree();
  let found = null;
  let path = [];

  function walk(nodes, ancestors) {
    for (const node of nodes ?? []) {
      const nextPath = [...ancestors, node];
      if (node.slug === slug) {
        found = node;
        path = nextPath;
        return true;
      }
      if (walk(node.children, nextPath)) return true;
    }
    return false;
  }

  walk(tree, []);
  return { tree, category: found, path };
});

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const { category, path } = await loadCategory(slug);
    if (!category) return { title: 'Không tìm thấy danh mục' };

    const parents = path.slice(0, -1).map((node) => node.name);
    return {
      title: category.name,
      description:
        category.description ||
        `Đồ chơi ${category.name} chính hãng tại KAIDO${parents.length ? ` — ${parents.join(' / ')}` : ''}.`,
      alternates: { canonical: `/category/${category.slug}` },
    };
  } catch {
    return { title: 'Danh mục sản phẩm' };
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedParams = (await searchParams) ?? {};

  const { category, path } = await loadCategory(slug);
  if (!category) notFound();

  const query = { ...parseCatalogQuery(resolvedParams), category_slug: slug };

  const [result, brands] = await Promise.all([
    listProducts({ query }).catch((error) => {
      console.warn('[m02:storefront] Không tải được sản phẩm danh mục:', error?.message ?? error);
      return null;
    }),
    listBrands().catch(() => []),
  ]);

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Sản phẩm', href: '/products' },
    ...path.map((node, index) => ({
      label: node.name,
      href: index === path.length - 1 ? undefined : `/category/${node.slug}`,
    })),
  ];

  return (
    <div className="kaido-container py-8 md:py-10">
      <Breadcrumb items={breadcrumbItems} />

      <header className="mt-4 rounded-md bg-surface-sky/50 px-5 py-6">
        <h1 className="font-heading text-h2 text-ink">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 max-w-3xl text-body-s text-slate">{category.description}</p>
        ) : null}
        <p className="mt-2 text-body-s text-slate">
          {result ? `${result.total} sản phẩm trong danh mục` : 'Đang cập nhật sản phẩm'}
        </p>

        {category.children?.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/category/${child.slug}`}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-fog bg-white px-3.5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <CatalogFilters
          categories={[]}
          brands={brands}
          lockedCategorySlug={category.slug}
          className="lg:sticky lg:top-24 lg:self-start"
        />

        <section aria-label={`Sản phẩm ${category.name}`}>
          {!result ? (
            <EmptyState
              title="Chưa tải được sản phẩm"
              description="Hệ thống đang bận hoặc mất kết nối dữ liệu. Vui lòng thử lại sau ít phút."
            />
          ) : result.items.length === 0 ? (
            <EmptyState
              title="Danh mục chưa có sản phẩm"
              description="Sản phẩm của danh mục này đang được cập nhật. Bạn có thể xem các danh mục khác."
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
                basePath={`/category/${category.slug}`}
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
