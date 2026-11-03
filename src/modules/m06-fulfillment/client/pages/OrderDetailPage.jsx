'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — OrderDetailPage
 * SRS: M06-F01, M06-F02, M06-F03 | API: API-M05-03, API-M06-03, API-M06-05
 * Route: /account/orders/[orderRef]
 * UI: Chi tiết đơn, hành trình vận chuyển, hủy đơn và lối tắt yêu cầu đổi trả.
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { OrderTrackingTimeline } from '@/modules/m05-checkout/public.client.js';
import { ORDER_STATUS } from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS_LABELS } from '@/shared/constants/payment.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { useGetOrderDetail } from '../hooks/use-get-order-detail.js';
import { ORDER_STATUS_TONES, PAYMENT_STATUS_TONES } from '../constants.js';
import { formatDateTime, remainingReturnDays } from '../utils/datetime.js';
import OrderTrackingStepper from '../components/OrderTrackingStepper.jsx';
import CarrierTrackingCard from '../components/CarrierTrackingCard.jsx';
import CancelOrderModal from '../components/CancelOrderModal.jsx';

const RETURN_WINDOW_DAYS = BUSINESS_RULES.SHIPPING.RETURN_WINDOW_DAYS;

export default function OrderDetailPage() {
  const params = useParams();
  const orderRef = typeof params?.orderRef === 'string' ? decodeURIComponent(params.orderRef) : '';

  const query = useGetOrderDetail({ orderRef }, { enabled: Boolean(orderRef) });
  const detail = query.data ?? null;
  const order = detail?.order ?? null;
  const items = detail?.order_items ?? [];

  function refresh() {
    query.refetch();
  }

  if (!orderRef) {
    return (
      <EmptyState
        title="Thiếu mã đơn hàng"
        description="Đường dẫn không chứa mã đơn cần xem."
        action={
          <Link href="/account/orders" className="kaido-link font-semibold">
            Về danh sách đơn
          </Link>
        }
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" rounded="md" />
        <Skeleton className="h-64 w-full" rounded="md" />
      </div>
    );
  }

  if (query.isError || !order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description={query.error?.message ?? 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}
        action={
          <Link
            href="/account/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Về danh sách đơn
          </Link>
        }
      />
    );
  }

  const completedMarker = order.completed_at ?? order.updated_at;
  const canReturn =
    order.status === ORDER_STATUS.COMPLETED &&
    remainingReturnDays(completedMarker, RETURN_WINDOW_DAYS) > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="text-caption text-slate">
            <Link href="/account/orders" className="hover:text-primary hover:underline">
              Đơn hàng của tôi
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <span className="font-semibold text-ink">{order.order_code}</span>
          </nav>
          <h1 className="mt-1 font-heading text-h2 text-ink">{order.order_code}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={ORDER_STATUS_TONES[order.status] ?? 'neutral'}>{order.status_label}</Badge>
            <Badge tone={PAYMENT_STATUS_TONES[order.payment_status] ?? 'neutral'}>
              {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
            </Badge>
            <span className="text-caption text-slate">
              Đặt lúc {formatDateTime(order.placed_at ?? order.created_at)}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} loading={query.isFetching}>
          Làm mới
        </Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-5">
          <section
            aria-labelledby="account-order-items-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="account-order-items-title" className="font-heading text-h5 text-ink">
              Sản phẩm ({order.item_count ?? items.length})
            </h2>
            <ul className="mt-3 divide-y divide-fog">
              {items.map((item) => (
                <li key={item.order_item_id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky">
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
                    <p className="text-body-s font-semibold text-ink">{item.product_name}</p>
                    <p className="text-caption text-slate">
                      {[item.variant_name, item.sku].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="text-caption text-slate">
                      {item.quantity} × {formatVND(item.unit_price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-body-s font-semibold text-ink">
                    {formatVND(item.line_total)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-fog pt-3 text-body-s">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Tạm tính</dt>
                <dd className="text-ink">{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Phí vận chuyển</dt>
                <dd className="text-ink">
                  {order.shipping_fee === 0 ? 'Miễn phí' : formatVND(order.shipping_fee)}
                </dd>
              </div>
              {order.discount_amount > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate">
                    Giảm giá {order.coupon_code ? `(${order.coupon_code})` : ''}
                  </dt>
                  <dd className="text-sale">-{formatVND(order.discount_amount)}</dd>
                </div>
              ) : null}
              {order.points_discount_amount > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate">Điểm thưởng ({order.points_used} điểm)</dt>
                  <dd className="text-sale">-{formatVND(order.points_discount_amount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-fog pt-2">
                <dt className="font-semibold text-ink">Tổng thanh toán</dt>
                <dd className="font-heading text-h5 text-primary">
                  {formatVND(order.total_amount)}
                </dd>
              </div>
            </dl>
          </section>

          <OrderTrackingStepper orderRef={order.order_code} />
          <CarrierTrackingCard orderRef={order.order_code} />
          <OrderTrackingTimeline history={detail?.tracking_history ?? []} />
        </div>

        <aside className="space-y-5">
          <section
            aria-labelledby="account-order-recipient-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="account-order-recipient-title" className="font-heading text-h5 text-ink">
              Người nhận
            </h2>
            <dl className="mt-3 space-y-2 text-body-s">
              <div>
                <dt className="text-slate">Họ tên</dt>
                <dd className="font-semibold text-ink">{order.recipient?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate">Điện thoại</dt>
                <dd className="text-ink">{order.recipient?.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate">Địa chỉ</dt>
                <dd className="text-ink">
                  {[
                    order.recipient?.address_line,
                    order.recipient?.ward,
                    order.recipient?.district,
                    order.recipient?.province,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
              {order.note ? (
                <div>
                  <dt className="text-slate">Ghi chú</dt>
                  <dd className="text-ink">{order.note}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section
            aria-labelledby="account-order-payment-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="account-order-payment-title" className="font-heading text-h5 text-ink">
              Thanh toán & vận chuyển
            </h2>
            <dl className="mt-3 space-y-2 text-body-s">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Phương thức</dt>
                <dd className="font-semibold text-ink">{order.payment_method_label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Trạng thái</dt>
                <dd className="text-ink">
                  {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Vận chuyển</dt>
                <dd className="text-ink">{order.shipping_method_label}</dd>
              </div>
              {order.carrier_code ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate">Đơn vị vận chuyển</dt>
                  <dd className="text-ink">{order.carrier_code}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section
            aria-labelledby="account-order-actions-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="account-order-actions-title" className="font-heading text-h5 text-ink">
              Thao tác
            </h2>
            <div className="mt-3 space-y-2">
              {canReturn ? (
                <Link
                  href={`/account/orders/${encodeURIComponent(order.order_code)}/return`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
                >
                  Yêu cầu đổi trả
                </Link>
              ) : null}
              <CancelOrderModal
                orderRef={order.order_code}
                orderCode={order.order_code}
                status={order.status}
                isPaid={order.is_paid}
                onCancelled={refresh}
                className="w-full"
              />
              <Link
                href="/account/support"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-sm border border-fog px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
              >
                Liên hệ CSKH
              </Link>
            </div>
            {canReturn ? (
              <p className="mt-3 text-caption text-slate">
                Đổi trả trong {RETURN_WINDOW_DAYS} ngày kể từ khi đơn hoàn thành (BR-M06-05).
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
