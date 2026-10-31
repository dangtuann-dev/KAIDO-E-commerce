/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — BlogPostPage
 * SRS: M09-F02, M09-F07 | API: API-M09-07, API-M09-06
 * Route: /blog/[slug]
 * Render: Server Component (SEO) — nội dung bài viết, OpenGraph và bài viết liên quan.
 * Nội dung WYSIWYG được render dưới dạng văn bản thuần (không chèn HTML thô) để chống XSS.
 */
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import { formatDate } from '../display.js';
import { getArticleBySlug, listPublicArticles } from '../../server/service.js';

async function loadArticle(slug) {
  try {
    return await getArticleBySlug({ slug });
  } catch (error) {
    if (error?.code === 'NOT_FOUND') return null;
    console.warn('[m09:blog] Không tải được bài viết:', error?.message ?? error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = (await params) ?? {};
  const article = slug ? await loadArticle(slug) : null;

  if (!article) {
    return { title: 'Không tìm thấy bài viết' };
  }

  const title = article.seo?.title ?? article.title;
  const description = article.seo?.description ?? article.excerpt ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: article.published_at ?? undefined,
      images: article.seo?.image ? [{ url: article.seo.image }] : undefined,
    },
  };
}

function ArticleBody({ content }) {
  const blocks = String(content ?? '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return <p className="text-body-l text-slate">Nội dung bài viết đang được cập nhật.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <p key={index} className="whitespace-pre-line text-body-l leading-relaxed text-ink">
          {block}
        </p>
      ))}
    </div>
  );
}

export default async function BlogPostPage({ params }) {
  const { slug } = (await params) ?? {};
  const article = await loadArticle(slug);

  if (!article) notFound();

  const related = await listPublicArticles({ query: { limit: 4 } })
    .then((result) => (result?.items ?? []).filter((item) => item.id !== article.id).slice(0, 3))
    .catch(() => []);

  return (
    <article className="kaido-container py-8 md:py-10">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Cẩm nang', href: '/blog' },
          { label: article.title },
        ]}
      />

      <header className="mt-4 max-w-3xl">
        {article.category ? (
          <Link
            href={`/blog?category=${encodeURIComponent(article.category.slug)}`}
            className="text-caption font-semibold uppercase tracking-wide text-primary"
          >
            {article.category.name}
          </Link>
        ) : null}

        <h1 className="mt-2 font-heading text-h1 text-ink">{article.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-s text-slate">
          {article.published_at ? (
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          ) : null}
          <span aria-hidden="true" className="text-mist">
            ·
          </span>
          <span>{Number(article.view_count).toLocaleString('vi-VN')} lượt xem</span>
        </div>

        {article.excerpt ? (
          <p className="mt-4 text-body-l text-slate">{article.excerpt}</p>
        ) : null}
      </header>

      {article.cover_image_url ? (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-surface-sky/40">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-8 max-w-3xl">
        <ArticleBody content={article.content} />
      </div>

      {related.length > 0 ? (
        <section className="mt-12 border-t border-fog pt-8">
          <h2 className="font-heading text-h3 text-ink">Bài viết liên quan</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ArticleCard article={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
