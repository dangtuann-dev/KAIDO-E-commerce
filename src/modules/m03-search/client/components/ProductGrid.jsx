'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — ProductGrid
 * SRS: M03-F08, M02-F10 | API: API-M03-01
 * Route: /search
 * UI: Lưới sản phẩm responsive, 12 sản phẩm/trang, skeleton khi tải.
 */
import { ProductCard } from '@/modules/m02-catalog/public.client.js';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { cn } from '@/shared/utils/cn.js';

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-fog bg-white">
      <Skeleton rounded="sm" className="aspect-square w-full" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-2/5" />
      </div>
    </div>
  );
}

export default function ProductGrid({
  products = [],
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  skeletonCount = 8,
  className,
}) {
  if (loading) {
    return (
      <ul
        aria-busy="true"
        aria-label="Đang tải sản phẩm"
        className={cn('grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4', className)}
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <li key={index}>
            <ProductSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    const busy = error?.status === 503 || error?.code === 'SERVICE_UNAVAILABLE';
    return (
      <EmptyState
        title={busy ? 'Hệ thống đang bận' : 'Không tải được sản phẩm'}
        description={
          busy
            ? 'Hệ thống đang bận, vui lòng thử lại sau ít phút.'
            : 'Đã xảy ra lỗi khi tải kết quả tìm kiếm. Vui lòng thử lại.'
        }
        action={
          onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null
        }
        className={className}
      />
    );
  }

  if (products.length === 0) return null;

  return (
    <ul
      aria-busy={fetching || undefined}
      className={cn(
        'grid grid-cols-2 gap-4 transition-opacity duration-250 md:grid-cols-3 xl:grid-cols-4',
        fetching && 'opacity-60',
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
