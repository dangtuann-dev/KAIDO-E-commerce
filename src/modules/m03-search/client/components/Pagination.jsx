'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — Pagination
 * SRS: M03-F08, API-M03-01
 * Route: /search, /category/[slug]
 * UI: Phân trang dạng số có ellipsis; hiển thị tổng kết quả.
 */
import { useRouter } from 'next/navigation';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { cn } from '@/shared/utils/cn.js';
import PaginationControl from '@/shared/ui/pagination.jsx';

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = BUSINESS_RULES.CATALOG.DEFAULT_PAGE_SIZE,
  onPageChange,
  disabled = false,
  className,
}) {
  const router = useRouter();

  if (!Number.isFinite(totalPages) || totalPages <= 0) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const start = totalItems > 0 ? (current - 1) * pageSize + 1 : 0;
  const end = totalItems > 0 ? Math.min(current * pageSize, totalItems) : 0;

  function handlePageChange(nextPage) {
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (nextPage <= 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(nextPage));
    }
    router.push(`${url.pathname}${url.search}`, { scroll: false });
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {totalItems > 0 ? (
        <p className="text-body-s text-slate">
          Hiển thị <span className="font-semibold text-ink">{start}</span>–
          <span className="font-semibold text-ink">{end}</span> trong{' '}
          <span className="font-semibold text-ink">{totalItems}</span> kết quả
        </p>
      ) : null}

      <PaginationControl
        page={current}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={disabled}
      />
    </div>
  );
}
