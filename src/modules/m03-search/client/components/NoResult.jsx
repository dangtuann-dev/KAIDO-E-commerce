'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — NoResult
 * SRS: M03-F10 | API: API-M03-03
 * Route: /search
 * UI: Trạng thái không có kết quả kèm từ khóa phổ biến và gợi ý xóa bộ lọc.
 */
import Link from 'next/link';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { cn } from '@/shared/utils/cn.js';

export default function NoResult({
  keyword,
  popularKeywords = [],
  popularLoading = false,
  hasFilters = false,
  onClearFilters,
  className,
}) {
  return (
    <EmptyState
      title="Không tìm thấy sản phẩm phù hợp"
      description={
        keyword
          ? `Không có kết quả cho “${keyword}”. Thử từ khóa khác hoặc bỏ bớt bộ lọc.`
          : 'Không có sản phẩm nào khớp với bộ lọc hiện tại. Hãy thử bỏ bớt bộ lọc.'
      }
      className={className}
      action={
        <div className="flex flex-col items-center gap-5">
          {popularLoading ? (
            <div className="flex flex-wrap justify-center gap-2" aria-label="Đang tải gợi ý">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} rounded="full" className="h-9 w-24" />
              ))}
            </div>
          ) : popularKeywords.length > 0 ? (
            <div>
              <p className="text-body-s font-semibold text-ink">Từ khóa phổ biến</p>
              <ul className="mt-2 flex max-w-xl flex-wrap justify-center gap-2">
                {popularKeywords.map((item) => (
                  <li key={item.keyword}>
                    <Link
                      href={`/search?keyword=${encodeURIComponent(item.keyword)}`}
                      className="inline-flex min-h-[36px] items-center rounded-full border border-fog bg-white px-3.5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
                    >
                      {item.keyword}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasFilters ? (
              <Button variant="primary" onClick={onClearFilters}>
                Xóa bộ lọc
              </Button>
            ) : null}
            <Link
              href="/products"
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center rounded-sm px-5 text-body-s font-semibold transition-colors duration-250',
                hasFilters
                  ? 'border border-fog bg-white text-ink hover:border-primary hover:text-primary'
                  : 'bg-primary text-white hover:bg-primary-hover',
              )}
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        </div>
      }
    />
  );
}
