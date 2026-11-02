'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSummarySidebar
 * SRS: M05-F05, M05-F06 | API: API-M05-01, API-M05-02 | BR: BR-M07-03, BR-M09-03
 * Route: /checkout
 * UI: Tóm tắt dòng hàng, phí ship, voucher, điểm thưởng và nút đặt hàng.
 * Tổng giảm không bao giờ vượt giá trị hàng — server đã chặn, UI chỉ hiển thị.
 */
import { useState } from 'react';
import { formatVND } from '@/shared/utils/formatVND.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { cn } from '@/shared/utils/cn.js';

const POINT_VALUE_VND = BUSINESS_RULES.LOYALTY.POINT_VALUE_VND;
const REDEEM_POINT_MULTIPLE = BUSINESS_RULES.LOYALTY.REDEEM_POINT_MULTIPLE;
const MAX_REDEMPTION_PERCENT = BUSINESS_RULES.LOYALTY.MAX_REDEMPTION_PERCENT;

/**
 * @param {{
 *   items?: Array<{ item_id: string, name: string, variant_name?: string|null, image_url?: string|null, quantity: number, unit_price?: number, line_total: number }>,
 *   subtotal?: number,
 *   shippingFee?: number,
 *   discountAmount?: number,
 *   pointsDiscountAmount?: number,
 *   totalAmount?: number,
 *   freeShippingThreshold?: number,
 *   freeShippingRemaining?: number,
 *   coupon?: { code?: string, valid?: boolean, discount_amount?: number } | null,
 *   onApplyCoupon?: (code: string | null) => void,
 *   pointsUsed?: number,
 *   onApplyPoints?: (points: number) => void,
 *   pointsPending?: boolean,
 *   warnings?: Array<{ type?: string, message: string }>,
 *   canPlaceOrder?: boolean,
 *   placing?: boolean,
 *   placeError?: string | null,
 *   onPlaceOrder?: () => void,
 *   paymentTimeoutMinutes?: number,
 *   className?: string,
 * }} props
 */
export default function OrderSummarySidebar({
  items = [],
  subtotal = 0,
  shippingFee = 0,
  discountAmount = 0,
  pointsDiscountAmount = 0,
  totalAmount = 0,
  freeShippingThreshold = 0,
  freeShippingRemaining = 0,
  coupon = null,
  onApplyCoupon,
  pointsUsed = 0,
  onApplyPoints,
  pointsPending = false,
  warnings = [],
  canPlaceOrder = false,
  placing = false,
  placeError = null,
  onPlaceOrder,
  paymentTimeoutMinutes = 20,
  className,
}) {
  const [couponDraft, setCouponDraft] = useState('');
  const [pointsDraft, setPointsDraft] = useState(pointsUsed ? String(pointsUsed) : '');

  const appliedCoupon = coupon?.valid ? coupon : null;

  function submitCoupon(event) {
    event.preventDefault();
    const code = couponDraft.trim().toUpperCase();
    if (!code) {
      onApplyCoupon?.(null);
      return;
    }
    onApplyCoupon?.(code);
    setCouponDraft('');
  }

  function submitPoints(event) {
    event.preventDefault();
    const parsed = Number(pointsDraft);
    onApplyPoints?.(Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0);
  }

  return (
    <section
      aria-labelledby="checkout-summary-title"
      className={cn('rounded-md border border-fog bg-white p-5 shadow-card lg:sticky lg:top-24', className)}
    >
      <h2 id="checkout-summary-title" className="font-heading text-h5 text-ink">
        Đơn hàng của bạn
      </h2>
      <p className="mt-1 text-caption text-slate">
        {items.length} sản phẩm · giá và tồn kho được kiểm tra lại khi đặt hàng
      </p>

      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.item_id ?? `${item.name}-${item.quantity}`} className="flex gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-s font-semibold text-ink">{item.name}</p>
              {item.variant_name ? (
                <p className="truncate text-caption text-slate">{item.variant_name}</p>
              ) : null}
              <p className="text-caption text-slate">
                {item.quantity} × {formatVND(item.unit_price ?? 0)}
              </p>
            </div>
            <span className="shrink-0 text-body-s font-semibold text-ink">
              {formatVND(item.line_total)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-fog pt-4 text-body-s">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Tạm tính</dt>
          <dd className="font-semibold text-ink">{formatVND(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Phí vận chuyển</dt>
          <dd className={cn('font-semibold', shippingFee === 0 ? 'text-success-strong' : 'text-ink')}>
            {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">
            Mã giảm giá{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
          </dt>
          <dd className={cn('font-semibold', discountAmount > 0 ? 'text-sale' : 'text-mist')}>
            {discountAmount > 0 ? `−${formatVND(discountAmount)}` : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate">Điểm thưởng{pointsUsed > 0 ? ` (${pointsUsed} điểm)` : ''}</dt>
          <dd className={cn('font-semibold', pointsDiscountAmount > 0 ? 'text-sale' : 'text-mist')}>
            {pointsDiscountAmount > 0 ? `−${formatVND(pointsDiscountAmount)}` : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-fog pt-4">
        <span className="text-body-s font-semibold text-ink">Tổng thanh toán</span>
        <span className="font-heading text-h4 text-primary">{formatVND(totalAmount)}</span>
      </div>

      {freeShippingThreshold > 0 ? (
        <p className="mt-3 rounded-sm bg-surface-sky px-3 py-2 text-caption text-primary">
          {freeShippingRemaining > 0
            ? `Mua thêm ${formatVND(freeShippingRemaining)} để được miễn phí vận chuyển.`
            : 'Đơn hàng của bạn đã được miễn phí vận chuyển.'}
        </p>
      ) : null}

      <div className="mt-4 space-y-4 border-t border-fog pt-4">
        <form onSubmit={submitCoupon} className="space-y-2">
          <label htmlFor="checkout-coupon" className="text-body-s font-semibold text-ink">
            Mã giảm giá
          </label>
          <div className="flex gap-2">
            <Input
              id="checkout-coupon"
              value={couponDraft}
              onChange={(event) => setCouponDraft(event.target.value.toUpperCase())}
              placeholder="VD: TOY2026"
              autoComplete="off"
              maxLength={20}
              containerClassName="flex-1"
              disabled={placing}
            />
            <Button type="submit" variant="outline" disabled={placing}>
              Áp dụng
            </Button>
          </div>
          {appliedCoupon ? (
            <p className="text-caption font-semibold text-success-strong">
              Đang dùng mã {appliedCoupon.code} · giảm {formatVND(appliedCoupon.discount_amount ?? 0)}
              <button
                type="button"
                onClick={() => onApplyCoupon?.(null)}
                className="ml-2 min-h-[44px] align-middle font-semibold text-slate underline hover:text-sale"
              >
                Bỏ mã
              </button>
            </p>
          ) : null}
        </form>

        <form onSubmit={submitPoints} className="space-y-2">
          <label htmlFor="checkout-points" className="text-body-s font-semibold text-ink">
            Dùng điểm thưởng
          </label>
          <div className="flex gap-2">
            <Input
              id="checkout-points"
              type="number"
              inputMode="numeric"
              min={0}
              step={REDEEM_POINT_MULTIPLE}
              value={pointsDraft}
              onChange={(event) => setPointsDraft(event.target.value)}
              placeholder="Bội số của 10"
              containerClassName="flex-1"
              disabled={placing}
            />
            <Button type="submit" variant="outline" loading={pointsPending} disabled={placing}>
              Dùng
            </Button>
          </div>
          <p className="text-caption text-slate">
            {REDEEM_POINT_MULTIPLE} điểm = {formatVND(REDEEM_POINT_MULTIPLE * POINT_VALUE_VND)} · tối
            đa {MAX_REDEMPTION_PERCENT}% giá trị hàng.
          </p>
        </form>
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {warnings.map((warning, index) => (
            <li
              key={`${warning.type ?? 'warning'}-${index}`}
              className="rounded-sm bg-accent/20 px-3 py-2 text-caption text-ink"
            >
              {warning.message}
            </li>
          ))}
        </ul>
      ) : null}

      {placeError ? (
        <p role="alert" className="mt-4 rounded-sm bg-sale/10 px-3 py-2 text-body-s text-sale">
          {placeError}
        </p>
      ) : null}

      <Button
        variant="accent"
        size="lg"
        className="mt-4 w-full"
        onClick={onPlaceOrder}
        loading={placing}
        disabled={!canPlaceOrder}
        loadingLabel="Đang đặt hàng…"
      >
        Đặt hàng
      </Button>

      <p className="mt-3 text-caption text-slate">
        Sau khi đặt, đơn thanh toán online cần hoàn tất trong {paymentTimeoutMinutes} phút, quá hạn
        đơn sẽ tự hủy và tồn kho được trả lại.
      </p>
    </section>
  );
}
