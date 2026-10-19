'use client';

import { cn } from '@/shared/utils/cn.js';

function buildPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...visible]
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

const PAGE_BUTTON_BASE =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-sm border px-3 text-body-s font-semibold transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40';

/**
 * [SHARED] Pagination — phân trang PLP mặc định 12 sản phẩm/trang (M03-F08).
 * Điều hướng có thể thay bằng hrefForPage khi cần URL chia sẻ được.
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  disabled = false,
  className,
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const items = buildPageItems(current, totalPages);

  return (
    <nav
      aria-label="Phân trang"
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
    >
      <button
        type="button"
        onClick={() => onPageChange?.(current - 1)}
        disabled={disabled || current <= 1}
        aria-label="Trang trước"
        className={cn(
          PAGE_BUTTON_BASE,
          'border-fog bg-white text-ink hover:border-primary hover:text-primary',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {items.map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange?.(item)}
            disabled={disabled}
            aria-current={item === current ? 'page' : undefined}
            aria-label={`Trang ${item}`}
            className={cn(
              PAGE_BUTTON_BASE,
              item === current
                ? 'border-primary bg-primary text-white'
                : 'border-fog bg-white text-ink hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-slate">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange?.(current + 1)}
        disabled={disabled || current >= totalPages}
        aria-label="Trang sau"
        className={cn(
          PAGE_BUTTON_BASE,
          'border-fog bg-white text-ink hover:border-primary hover:text-primary',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  );
}
