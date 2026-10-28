/**
 * [TOY-M02] Sản phẩm và danh mục — ProductCard
 * SRS: M02-F10, M02-F11, M02-F08 | API: API-M02-02, API-M02-03 | BR: BR-M02-03, BR-M02-05
 * Route: /products, /category/[slug], trang chủ
 * UI: Ảnh 1:1, tên, giá niêm yết/sale gạch ngang, nhãn hết hàng (Blueprint §3.3).
 * Component thuần hiển thị — dùng được ở cả Server và Client Component.
 */
import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import AgeBadge from './AgeBadge.jsx';
import ProductStockBadge from './ProductStockBadge.jsx';

function formatSold(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return null;
  return `Đã bán ${new Intl.NumberFormat('vi-VN').format(count)}`;
}

export default function ProductCard({ product, priority = false, className }) {
  if (!product) return null;

  const hasSale =
    product.price_sale != null && Number(product.price_sale) < Number(product.price_regular);
  const outOfStock = product.stock?.status === 'OUT_OF_STOCK';
  const contextLabel = product.brand?.name ?? product.category?.name ?? null;
  const soldLabel = formatSold(product.sold_count);
  const rating = Number(product.rating_avg);
  const ratingCount = Number(product.rating_count);

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-md border border-fog bg-white transition-shadow duration-250 hover:shadow-card',
        className,
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-surface-sky/40">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={product.thumbnail_alt || product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-250 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-full w-full place-items-center text-body-s text-mist"
            >
              Chưa có ảnh
            </div>
          )}

          {hasSale ? (
            <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-sale px-2.5 py-1 text-caption font-bold text-white">
              -{Math.round(Number(product.discount_percent))}%
            </span>
          ) : null}

          {outOfStock ? (
            <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-3 py-1.5 text-center text-caption font-semibold text-white">
              Hết hàng
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5">
          {contextLabel ? (
            <p className="text-caption font-semibold uppercase tracking-wide text-slate">
              {contextLabel}
            </p>
          ) : null}

          <h3 className="line-clamp-2 font-heading text-h6 text-ink">{product.name}</h3>

          <div className="mt-auto flex flex-wrap items-baseline gap-2">
            <span className={cn('text-price', hasSale ? 'text-sale' : 'text-ink')}>
              {formatVND(product.price)}
            </span>
            {hasSale ? (
              <s className="text-price-old text-mist">{formatVND(product.price_regular)}</s>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AgeBadge ageGroup={product.age_group} />
            <ProductStockBadge stock={product.stock} />
          </div>

          {soldLabel || (rating > 0 && ratingCount > 0) ? (
            <p className="text-caption text-slate">
              {rating > 0 && ratingCount > 0 ? (
                <span className="mr-2 text-ink">
                  <span aria-hidden="true" className="text-star">
                    ★
                  </span>{' '}
                  {rating.toFixed(1)} ({ratingCount})
                </span>
              ) : null}
              {soldLabel}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
