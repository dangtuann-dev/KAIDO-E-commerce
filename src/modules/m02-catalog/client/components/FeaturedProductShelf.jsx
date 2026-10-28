'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — FeaturedProductShelf
 * SRS: M02-F10 | API: API-M02-02
 * Route: Trang chủ (M09) — khu sản phẩm nổi bật/bán chạy.
 * Client Component vì cần tải dữ liệu sau khi hydrate; skeleton giữ layout ổn định.
 */
import Link from 'next/link';
import Skeleton from '@/shared/ui/skeleton.jsx';
import ProductCard from './ProductCard.jsx';
import { useListProducts } from '../hooks/use-list-products.js';

function ShelfSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="rounded-md border border-fog p-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

export default function FeaturedProductShelf({
  title = 'Sản phẩm nổi bật',
  limit = 8,
  sort = 'bestselling',
}) {
  const { data, isPending, isError, refetch } = useListProducts({ query: { limit, sort } });

  const items = data?.items ?? [];

  return (
    <div className="kaido-container py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-h3 text-ink">{title}</h2>
          <p className="mt-1 text-body-s text-slate">Được phụ huynh chọn mua nhiều tại KAIDO.</p>
        </div>
        <Link href="/products" className="text-body-s font-semibold text-primary">
          Xem tất cả
        </Link>
      </div>

      <div className="mt-5">
        {isPending ? (
          <ShelfSkeleton />
        ) : isError ? (
          <div className="rounded-md border border-dashed border-fog p-6 text-center">
            <p className="text-body-s text-slate">Chưa tải được sản phẩm nổi bật.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 min-h-[44px] rounded-sm border border-primary px-4 text-body-s font-semibold text-primary"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-dashed border-fog p-6 text-center text-body-s text-slate">
            Sản phẩm đang được cập nhật.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
