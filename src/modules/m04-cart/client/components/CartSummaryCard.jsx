'use client';

/**
 * [TOY-M04] Giỏ hàng — CartSummaryCard
 * SRS: M04-F05, M04-F06, M04-F07 | API: API-M04-07, API-M04-08 | BR: BR-M04-05
 * Route: /cart
 * UI: Cột tóm tắt tạm tính, giảm giá, tổng tạm tính + CTA thanh toán các dòng đã chọn.
 */
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import Button from '@/shared/ui/button.jsx';

/**
 * @param {{
 *   itemCount?: number,
 *   selectedCount?: number,
 *   subtotal?: number,
 *   discount?: number,
 *   estimatedTotal?: number,
 *   maxQuantity?: number,
 *   checkoutLoading?: boolean,
 *   clearingAll?: boolean,
 *   onCheckout?: () => void,
 *   onClearAll?: () => void,
 *   freeShippingThreshold?: number,
 *   className?: string,
 * }} props
 */
export default function CartSummaryCard({
  itemCount = 0,
  selectedCount = 0,
  subtotal = 0,
  discount = 0,
  estimatedTotal = 0,
  maxQuantity = 20,
  checkoutLoading = false,
  clearingAll = false,
  onCheckout,
  onClearAll,
  freeShippingThreshold = 0,
  className,
}) {
  const canCheckout = selectedCount > 0;
  const missingForFreeShipping =
    freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - subtotal) : 0;

  return (
    <section
      aria-labelledby="cart-summary-title"
      className={cn(
        'rounded-md border border-fog bg-white p-5 shadow-card lg:sticky lg:top-24',
        className,
      )}
    >
      <h2 id="cart-summary-title" className="font-heading text-h5 text-ink">
        Tóm tắt đơn hàng
      </h2>
      <p className="mt-1 text-caption text-slate">
        Đã chọn {selectedCount}/{itemCount} sản phẩm · tối đa {maxQuantity} đơn vị mỗi món
      </p>

      <dl className="mt-4 space-y-2 border-t border-fog pt-4 text-body-s">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Tạm tính</dt>
          <dd className="font-semibold text-ink">{formatVND(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Giảm giá</dt>
          <dd className={cn('font-semibold', discount > 0 ? 'text-sale' : 'text-mist')}>
            {discount > 0 ? `−${formatVND(discount)}` : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Phí vận chuyển</dt>
          <dd className="text-slate">Tính ở bước thanh toán</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-fog pt-4">
        <span className="text-body-s font-semibold text-ink">Tổng tạm tính</span>
        <span className="font-heading text-h4 text-primary">{formatVND(estimatedTotal)}</span>
      </div>

      {missingForFreeShipping > 0 ? (
        <p className="mt-3 rounded-sm bg-surface-sky px-3 py-2 text-caption text-primary">
          Mua thêm {formatVND(missingForFreeShipping)} để được miễn phí vận chuyển.
        </p>
      ) : null}

      <Button
        variant="accent"
        size="lg"
        className="mt-4 w-full"
        onClick={onCheckout}
        loading={checkoutLoading}
        disabled={!canCheckout}
      >
        {canCheckout ? `Thanh toán ${selectedCount} sản phẩm` : 'Chọn sản phẩm để thanh toán'}
      </Button>

      {!canCheckout && itemCount > 0 ? (
        <p className="mt-2 text-caption text-sale">
          Các sản phẩm hết hàng hoặc ngừng bán không thể thanh toán.
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center text-body-s font-semibold text-primary hover:underline"
        >
          Tiếp tục mua sắm
        </Link>
        {onClearAll && itemCount > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            disabled={clearingAll}
            className="inline-flex min-h-[44px] items-center text-body-s font-semibold text-slate transition-colors duration-250 hover:text-sale disabled:opacity-50"
          >
            {clearingAll ? 'Đang xóa…' : 'Xóa tất cả'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
