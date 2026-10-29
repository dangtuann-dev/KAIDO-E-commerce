'use client';

/**
 * [TOY-M04] Giỏ hàng — SavedItemsList
 * SRS: M04-F10 | API: API-M04-11, API-M04-12
 * Route: /cart
 * UI: Danh sách “Để dành mua sau”: thêm lại vào giỏ hoặc xóa hẳn.
 */
import Image from 'next/image';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import Button from '@/shared/ui/button.jsx';

const BLOCKING_STATUSES = new Set(['OUT_OF_STOCK', 'UNAVAILABLE']);

/**
 * @param {{
 *   items?: Array<object>,
 *   busyId?: string | null,
 *   onRestore?: (savedItemId: string) => void,
 *   onRemove?: (savedItemId: string) => void,
 *   className?: string,
 * }} props
 */
export default function SavedItemsList({ items = [], busyId = null, onRestore, onRemove, className }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section aria-labelledby="cart-saved-title" className={cn('mt-8', className)}>
      <div className="flex items-center gap-2">
        <h2 id="cart-saved-title" className="font-heading text-h5 text-ink">
          Để dành mua sau
        </h2>
        <span className="rounded-full bg-fog px-2 py-0.5 text-caption font-semibold text-slate">
          {items.length}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-fog rounded-md border border-fog bg-white">
        {items.map((item) => {
          const blocked = BLOCKING_STATUSES.has(item.stock_status);
          const busy = busyId === item.saved_item_id;
          return (
            <li key={item.saved_item_id} className="flex gap-3 p-3 sm:p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-full w-full place-items-center font-heading text-h5 text-primary"
                  >
                    {String(item.name ?? 'K').charAt(0)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-body-s font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-caption text-slate">
                  {formatVND(item.current_price ?? 0)} · số lượng {item.quantity}
                </p>
                {blocked ? (
                  <p className="mt-1 text-caption font-semibold text-sale">
                    {item.stock_status === 'OUT_OF_STOCK' ? 'Tạm hết hàng' : 'Ngừng kinh doanh'}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore?.(item.saved_item_id)}
                    loading={busy}
                    disabled={blocked}
                  >
                    Thêm lại vào giỏ
                  </Button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(item.saved_item_id)}
                    disabled={busy}
                    className="inline-flex min-h-[44px] items-center px-1 text-caption font-semibold text-slate transition-colors duration-250 hover:text-sale disabled:opacity-40"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
