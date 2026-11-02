'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSuccessCard
 * SRS: M05-F08 | API: API-M05-03 | BR: BR-M05-02
 * Route: /order-success/[code]
 * UI: Mã đơn, tổng tiền, phương thức thanh toán, hạn thanh toán và CTA theo dõi đơn.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import { formatDateTime, formatDuration, remainingMs } from '../utils/datetime.js';

const STATUS_TONES = {
  PENDING_PAYMENT: 'warning',
  PENDING: 'info',
  PENDING_APPROVAL: 'warning',
  CONFIRMED: 'info',
  PACKING: 'info',
  SHIPPING: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  CANCELLED_TIMEOUT: 'danger',
  DELIVERY_FAILED: 'danger',
  RETURNING: 'neutral',
  RETURNED: 'neutral',
};

/**
 * @param {{
 *   order?: object,
 *   paymentInfo?: { method_label?: string, status?: string, paid_at?: string|null, expires_at?: string|null },
 *   nextSteps?: string[],
 *   cancelling?: boolean,
 *   onCancel?: () => void,
 *   sandboxHref?: string | null,
 * }} props
 */
export default function OrderSuccessCard({
  order,
  paymentInfo,
  nextSteps = [],
  cancelling = false,
  onCancel,
  sandboxHref = null,
}) {
  const expiresAt = order?.payment_expires_at ?? paymentInfo?.expires_at ?? null;
  const isWaitingPayment = order?.status === 'PENDING_PAYMENT';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isWaitingPayment || !expiresAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isWaitingPayment, expiresAt]);

  const left = remainingMs(expiresAt, now);
  const expired = isWaitingPayment && expiresAt ? left <= 0 : false;

  const tone = STATUS_TONES[order?.status] ?? 'neutral';
  const heading = order?.is_paid
    ? 'Đặt hàng thành công!'
    : isWaitingPayment
      ? 'Đơn hàng đã được tạo — chờ thanh toán'
      : order?.status === 'PENDING_APPROVAL'
        ? 'Đơn hàng đang chờ xác nhận'
        : 'Đã ghi nhận đơn hàng';

  return (
    <section
      aria-labelledby="order-success-title"
      className="rounded-md border border-fog bg-white p-6 shadow-card md:p-8"
    >
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 place-items-center rounded-full bg-success/10"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-success" fill="none">
            <path
              d="m5 13 4.5 4.5L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 id="order-success-title" className="mt-4 font-heading text-h3 text-ink">
          {heading}
        </h1>
        <p className="mt-1 text-body-s text-slate">
          Mã đơn hàng{' '}
          <span className="font-semibold text-ink">{order?.order_code ?? '—'}</span>
        </p>
        {order?.status_label ? (
          <div className="mt-3">
            <Badge tone={tone}>{order.status_label}</Badge>
          </div>
        ) : null}
      </div>

      {isWaitingPayment ? (
        <div className="mt-6 rounded-sm border border-accent-active/40 bg-accent/10 px-4 py-3 text-center">
          {expired ? (
            <p className="text-body-s font-semibold text-sale">
              Đã quá thời gian giữ tồn. Đơn hàng sẽ được hệ thống hủy tự động.
            </p>
          ) : (
            <p className="text-body-s font-semibold text-ink">
              Vui lòng hoàn tất thanh toán trong {formatDuration(left)}.
            </p>
          )}
          <p className="mt-1 text-caption text-slate">
            Hạn thanh toán: {formatDateTime(expiresAt)}
          </p>
        </div>
      ) : null}

      <dl className="mt-6 grid gap-3 border-y border-fog py-4 text-body-s sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
          <dt className="text-slate">Tổng thanh toán</dt>
          <dd className="font-heading text-h5 text-primary">{formatVND(order?.total_amount ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
          <dt className="text-slate">Phương thức thanh toán</dt>
          <dd className="font-semibold text-ink">
            {paymentInfo?.method_label ?? order?.payment_method_label ?? '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
          <dt className="text-slate">Phí vận chuyển</dt>
          <dd className="font-semibold text-ink">
            {(order?.shipping_fee ?? 0) === 0 ? 'Miễn phí' : formatVND(order?.shipping_fee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
          <dt className="text-slate">Ngày đặt</dt>
          <dd className="font-semibold text-ink">{formatDateTime(order?.placed_at ?? order?.created_at)}</dd>
        </div>
      </dl>

      {order?.recipient ? (
        <div className="mt-4 text-body-s">
          <p className="font-semibold text-ink">Giao đến</p>
          <p className="mt-1 text-slate">
            {order.recipient.name} · {order.recipient.phone}
          </p>
          <p className="text-slate">
            {[order.recipient.address_line, order.recipient.ward, order.recipient.district, order.recipient.province]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      ) : null}

      {nextSteps.length > 0 ? (
        <ul className="mt-4 space-y-1.5 rounded-sm bg-surface-sky px-4 py-3 text-body-s text-primary">
          {nextSteps.map((step) => (
            <li key={step} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/account/orders/${order?.order_code ?? ''}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
        >
          Theo dõi đơn hàng
        </Link>
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
        >
          Tiếp tục mua sắm
        </Link>
        {sandboxHref && !order?.is_paid ? (
          <Link
            href={sandboxHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-accent px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:bg-accent-hover"
          >
            Thanh toán ngay (mô phỏng)
          </Link>
        ) : null}
        {order?.can_cancel && onCancel ? (
          <Button variant="ghost" onClick={onCancel} loading={cancelling} className="text-sale">
            Hủy đơn hàng
          </Button>
        ) : null}
      </div>
    </section>
  );
}
