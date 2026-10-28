/**
 * [TOY-M02] Sản phẩm và danh mục — CatalogPagination
 * SRS: M02-F10 | API: API-M02-02
 * URL chuẩn SEO: /category/{slug}?page=1&sort=newest — component thuần Link.
 */
import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';

const BUTTON_BASE =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-sm border px-3 text-body-s font-semibold transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function pageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);

  const items = [];
  let previous = 0;
  for (const value of pages) {
    if (previous && value - previous > 1) items.push(`ellipsis-${previous}`);
    items.push(value);
    previous = value;
  }
  return items;
}

function buildHref(basePath, searchParams, page) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  if (page > 1) params.set('page', String(page));
  else params.delete('page');

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export default function CatalogPagination({
  basePath,
  searchParams = {},
  page = 1,
  totalPages = 1,
  className,
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);

  return (
    <nav aria-label="Phân trang" className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <Link
        href={buildHref(basePath, searchParams, Math.max(1, current - 1))}
        aria-label="Trang trước"
        aria-disabled={current <= 1 || undefined}
        className={cn(
          BUTTON_BASE,
          current <= 1
            ? 'pointer-events-none border-fog bg-white text-mist opacity-50'
            : 'border-fog bg-white text-ink hover:border-primary hover:text-primary',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>

      {pageItems(current, totalPages).map((item) =>
        typeof item === 'number' ? (
          <Link
            key={item}
            href={buildHref(basePath, searchParams, item)}
            aria-current={item === current ? 'page' : undefined}
            aria-label={`Trang ${item}`}
            className={cn(
              BUTTON_BASE,
              item === current
                ? 'border-primary bg-primary text-white'
                : 'border-fog bg-white text-ink hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </Link>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-slate">
            …
          </span>
        ),
      )}

      <Link
        href={buildHref(basePath, searchParams, Math.min(totalPages, current + 1))}
        aria-label="Trang sau"
        aria-disabled={current >= totalPages || undefined}
        className={cn(
          BUTTON_BASE,
          current >= totalPages
            ? 'pointer-events-none border-fog bg-white text-mist opacity-50'
            : 'border-fog bg-white text-ink hover:border-primary hover:text-primary',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>
    </nav>
  );
}
