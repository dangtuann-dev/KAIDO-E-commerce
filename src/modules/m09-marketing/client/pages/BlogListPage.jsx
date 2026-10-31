/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — BlogListPage
 * SRS: M09-F02, M09-F07 | API: API-M09-06
 * Route: /blog
 * Render: Server Component (SEO) — danh sách bài viết đã xuất bản, lọc chuyên mục, phân trang URL.
 */
import Link from 'next/link';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import BlogPagination from '../components/BlogPagination.jsx';
import { listPublicArticles } from '../../server/service.js';

const PAGE_SIZE = 9;

export const metadata = {
  title: 'Cẩm nang & tin tức',
  description:
    'Kinh nghiệm chọn đồ chơi an toàn, gợi ý quà tặng và tin tức khuyến mãi mới nhất từ KAIDO.',
  alternates: { canonical: '/blog' },
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseBlogQuery(searchParams = {}) {
  const pageNumber = Number(firstValue(searchParams.page));
  const category = String(firstValue(searchParams.category) ?? '').trim();
  return {
    page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    limit: PAGE_SIZE,
    category: category ? category.slice(0, 120) : undefined,
  };
}

export default async function BlogListPage({ searchParams }) {
  const query = parseBlogQuery((await searchParams) ?? {});
  const result = await listPublicArticles({ query }).catch((error) => {
    console.warn('[m09:blog] Không tải được bài viết:', error?.message ?? error);
    return null;
  });

  const articles = result?.items ?? [];
  const categories = result?.categories ?? [];
  const activeCategory = query.category ?? '';

  return (
    <div className="kaido-container py-8 md:py-10">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Cẩm nang' }]} />

      <header className="mt-4 max-w-3xl">
        <h1 className="font-heading text-h1 text-ink">Cẩm nang KAIDO</h1>
        <p className="mt-2 text-body-l text-slate">
          Kiến thức chọn đồ chơi theo độ tuổi, mẹo chơi cùng bé và tin tức ưu đãi mới nhất.
        </p>
      </header>

      {categories.length > 0 ? (
        <nav aria-label="Chuyên mục bài viết" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/blog"
                aria-current={activeCategory ? undefined : 'page'}
                className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-body-s font-semibold transition-colors duration-250 ${
                  activeCategory
                    ? 'border-fog bg-white text-ink hover:border-primary hover:text-primary'
                    : 'border-primary bg-primary text-white'
                }`}
              >
                Tất cả
              </Link>
            </li>
            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <li key={category.id}>
                  <Link
                    href={`/blog?category=${encodeURIComponent(category.slug)}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-body-s font-semibold transition-colors duration-250 ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : 'border-fog bg-white text-ink hover:border-primary hover:text-primary'
                    }`}
                  >
                    {category.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <div className="mt-6">
        {articles.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết nào"
            description="Nội dung đang được biên tập. Vui lòng quay lại sau ít ngày."
            action={
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-6 text-body-s font-semibold text-white"
              >
                Khám phá sản phẩm
              </Link>
            }
          />
        ) : (
          <>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <li key={article.id}>
                  <ArticleCard article={article} priority={index < 3} />
                </li>
              ))}
            </ul>

            <BlogPagination
              category={activeCategory}
              page={result?.page ?? query.page}
              totalPages={result?.total_pages ?? 1}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}
