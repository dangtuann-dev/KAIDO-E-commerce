/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — ArticleCard
 * SRS: M09-F02, M09-F07 | API: API-M09-06
 * Route: /blog, /blog/[slug], /
 * UI: Ảnh bìa tỉ lệ 16:10, tiêu đề, mô tả ngắn, chuyên mục và ngày đăng (Blueprint §3.3).
 * Component thuần hiển thị — dùng được ở cả Server và Client Component.
 */
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatPublishedAt(value) {
  const stamp = Date.parse(value ?? '');
  return Number.isFinite(stamp) ? DATE_FORMATTER.format(new Date(stamp)) : null;
}

export default function ArticleCard({ article, priority = false, className }) {
  if (!article) return null;

  const publishedLabel = formatPublishedAt(article.published_at);
  const categoryName = article.category?.name ?? null;

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-md border border-fog bg-white transition-shadow duration-250 hover:shadow-card',
        className,
      )}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sky/40">
          {article.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority={priority}
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-250 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-full w-full place-items-center text-body-s text-mist"
            >
              KAIDO Blog
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-caption text-slate">
            {categoryName ? (
              <span className="font-semibold uppercase tracking-wide text-primary">
                {categoryName}
              </span>
            ) : null}
            {categoryName && publishedLabel ? <span aria-hidden="true">·</span> : null}
            {publishedLabel ? <time dateTime={article.published_at}>{publishedLabel}</time> : null}
          </div>

          <h3 className="line-clamp-2 font-heading text-h5 text-ink">{article.title}</h3>

          {article.excerpt ? (
            <p className="line-clamp-3 text-body-s text-slate">{article.excerpt}</p>
          ) : null}

          <span className="mt-auto pt-2 text-body-s font-semibold text-primary">Đọc tiếp</span>
        </div>
      </Link>
    </article>
  );
}
