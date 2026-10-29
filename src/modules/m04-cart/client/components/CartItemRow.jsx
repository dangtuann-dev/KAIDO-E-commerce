'use client';

/**
 * [TOY-M04] Giỏ hàng — CartItemRow
 * SRS: M04-F03, M04-F04, M04-F06, M04-F10 | API: API-M04-03, API-M04-04, API-M04-10
 * BR: BR-M04-01, BR-M04-05, BR-M04-06
 * Route: /cart
 * UI: Dòng giỏ hàng: checkbox chọn, ảnh, biến thể, stepper số lượng, nút xóa và lưu mua sau.
 * Component thuần UI — mọi thao tác gọi qua callback do CartPage truyền xuống.
 */
import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import Checkbox from '@/shared/ui/checkbox.jsx';

const BLOCKING_STATUSES = new Set(['OUT_OF_STOCK', 'UNAVAILABLE']);

/**
 * @param {{
 *   item: object,
 *   selected?: boolean,
 *   busy?: boolean,
 *   maxQuantity?: number,
 *   onToggle?: (itemId: string, next: boolean) => void,
 *   onQuantityChange?: (itemId: string, quantity: number) => void,
 *   onRemove?: (item: object) => void,
 *   onSaveForLater?: (item: object) => void,
 * }} props
 */
export default function CartItemRow({
  item,
  selected = false,
  busy = false,
  maxQuantity = 20,
  onToggle,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}) {
  const quantity = Number(item?.quantity ?? 1);
  const maxQuantityPerItem = Number(item?.max_quantity_per_item ?? maxQuantity);
  const blocking = BLOCKING_STATUSES.has(item?.stock_status);
  const available = item?.available;
  const stockLimited = typeof available === 'number' && available > 0;
  const canIncrease =
    !blocking && quantity < maxQuantityPerItem && (!stockLimited || quantity < available);
  const productHref = item?.slug ? `/products/${item.slug}` : null;

  const name = productHref ? (
    <Link
      href={productHref}
      className="line-clamp-2 text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary"
    >
      {item.name}
    </Link>
  ) : (
    <p className="line-clamp-2 text-body-s font-semibold text-ink">{item.name}</p>
  );

  return (
    <li
      className={cn(
        'flex gap-3 border-b border-fog py-4 last:border-b-0 sm:gap-4',
        blocking && 'opacity-70',
      )}
    >
      <div className="shrink-0">
        <Checkbox
          checked={selected}
          disabled={blocking || busy}
          onChange={(event) => onToggle?.(item.item_id, event.target.checked)}
          label={<span className="sr-only">Chọn {item.name}</span>}
          containerClassName="w-5"
        />
      </div>

      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky sm:h-24 sm:w-24">
        {item?.image_url ? (
          <Image
            src={item.image_url}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-full w-full place-items-center font-heading text-h4 text-primary"
          >
            {String(item?.name ?? 'K').charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {name}
            {item?.variant_name ? (
              <p className="mt-0.5 text-caption text-slate">Phân loại: {item.variant_name}</p>
            ) : null}
            {item?.sku ? <p className="mt-0.5 text-caption text-mist">SKU: {item.sku}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onRemove?.(item)}
            disabled={busy}
            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-sale/10 hover:text-sale disabled:opacity-40"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M4 7h16M9 7V5h6v2M6.5 7l.8 12.1A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.9L17.5 7M10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-body-s font-semibold text-ink">{formatVND(item?.current_price ?? 0)}</p>
          {item?.price_changed && Number(item?.unit_price) > 0 ? (
            <>
              <span className="text-price-old text-mist line-through">
                {formatVND(item.unit_price)}
              </span>
              <span className="rounded-sm bg-accent/20 px-1.5 py-0.5 text-caption font-semibold text-ink">
                Giá mới
              </span>
            </>
          ) : null}
        </div>

        {item?.stock_status === 'OUT_OF_STOCK' ? (
          <p className="mt-1 text-caption font-semibold text-sale">Tạm hết hàng</p>
        ) : item?.stock_status === 'UNAVAILABLE' ? (
          <p className="mt-1 text-caption font-semibold text-sale">Ngừng kinh doanh</p>
        ) : item?.stock_status === 'INSUFFICIENT' ? (
          <p className="mt-1 text-caption font-semibold text-sale">
            Chỉ còn {available} sản phẩm — vui lòng giảm số lượng
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-sm border border-fog">
            <button
              type="button"
              onClick={() => onQuantityChange?.(item.item_id, quantity - 1)}
              disabled={busy}
              aria-label={`Giảm số lượng ${item.name}`}
              className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors duration-250 hover:bg-fog/60 disabled:opacity-40"
            >
              −
            </button>
            <span aria-live="polite" className="min-w-9 text-center text-body-s font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange?.(item.item_id, quantity + 1)}
              disabled={busy || !canIncrease}
              aria-label={`Tăng số lượng ${item.name}`}
              title={
                canIncrease
                  ? undefined
                  : `Tối đa ${stockLimited ? Math.min(available, maxQuantityPerItem) : maxQuantityPerItem} sản phẩm`
              }
              className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors duration-250 hover:bg-fog/60 disabled:opacity-40"
            >
              +
            </button>
          </div>

          <p className="text-body-s font-semibold text-primary">{formatVND(item?.line_total ?? 0)}</p>
        </div>

        {onSaveForLater ? (
          <button
            type="button"
            onClick={() => onSaveForLater(item)}
            disabled={busy}
            className="mt-1 inline-flex min-h-[44px] items-center text-caption font-semibold text-slate transition-colors duration-250 hover:text-primary disabled:opacity-40"
          >
            Để dành mua sau
          </button>
        ) : null}
      </div>
    </li>
  );
}
