'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderDetailPage
 * SRS: M05 | API/FR: M05-F11, M06-F06, M06-F07, API-M05-03, API-M05-07 | BR: BR-M06-01
 * Route: /admin/orders/[id]
 * Render: Client Component. Chỉ cho chuyển trạng thái nằm trong ORDER_TRANSITIONS.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatVND } from '@/shared/utils/formatVND.js';
import { useToast } from '@/shared/ui/toast.jsx';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
} from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS_LABELS } from '@/shared/constants/payment.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import OrderTrackingTimeline from '../components/OrderTrackingTimeline.jsx';
import { formatDateTime } from '../utils/datetime.js';
import { useGetOrderDetail } from '../hooks/use-get-order-detail.js';
import { useUpdateOrderStatus } from '../hooks/use-update-order-status.js';

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

const PAYMENT_TONES = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
  CANCELLED: 'neutral',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderRef = typeof params?.id === 'string' ? decodeURIComponent(params.id) : '';
  const toast = useToast();

  const [nextStatus, setNextStatus] = useState('');
  const [note, setNote] = useState('');

  const detailQuery = useGetOrderDetail({ orderRef }, { enabled: Boolean(orderRef) });
  const updateMutation = useUpdateOrderStatus();

  const detail = detailQuery.data ?? null;
  const order = detail?.order ?? null;
  const items = detail?.order_items ?? [];
  const paymentInfo = detail?.payment_info ?? null;

  const transitionOptions = useMemo(
    () =>
      (ORDER_TRANSITIONS[order?.status] ?? []).map((status) => ({
        value: status,
        label: ORDER_STATUS_LABELS[status] ?? status,
      })),
    [order?.status],
  );

  async function submitTransition() {
    if (!nextStatus) {
      toast.error('Vui lòng chọn trạng thái mới.');
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        id: order.order_id,
        body: { new_status: nextStatus, note: note.trim() || undefined },
      });
      toast.success(`Đã cập nhật: ${result.status_label ?? nextStatus}`);
      setNextStatus('');
      setNote('');
      await detailQuery.refetch();
    } catch (error) {
      if (error?.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
        const allowed = error?.details?.allowed ?? ORDER_TRANSITIONS[order?.status] ?? [];
        toast.error(
          `Không thể chuyển sang trạng thái này. Chỉ cho phép: ${
            allowed.map((status) => ORDER_STATUS_LABELS[status] ?? status).join(', ') || 'không có'
          }.`,
        );
        await detailQuery.refetch();
        return;
      }
      toast.error(error?.message ?? 'Không thể cập nhật trạng thái đơn hàng.');
    }
  }

  if (!orderRef) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState title="Thiếu mã đơn hàng" description="Đường dẫn không chứa mã đơn cần xem." />
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" rounded="md" />
      </div>
    );
  }

  if (detailQuery.isError || !order) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description={detailQuery.error?.message ?? 'Đơn hàng không tồn tại hoặc đã bị xóa.'}
          action={
            <Link
              href="/admin/orders"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Về danh sách đơn
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="text-caption text-slate">
            <Link href="/admin/orders" className="hover:text-primary hover:underline">
              Đơn hàng
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <span className="font-semibold text-ink">{order.order_code}</span>
          </nav>
          <h1 className="mt-1 font-heading text-h2 text-ink">{order.order_code}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[order.status] ?? 'neutral'}>{order.status_label}</Badge>
            <Badge tone={PAYMENT_TONES[order.payment_status] ?? 'neutral'}>
              {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
            </Badge>
            <span className="text-caption text-slate">
              Đặt lúc {formatDateTime(order.placed_at ?? order.created_at)}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => detailQuery.refetch()} loading={detailQuery.isFetching}>
          Làm mới
        </Button>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-5">
          <section
            aria-labelledby="admin-order-customer-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="admin-order-customer-title" className="font-heading text-h5 text-ink">
              Người nhận & khách hàng
            </h2>
            <dl className="mt-3 grid gap-3 text-body-s sm:grid-cols-2">
              <div>
                <dt className="text-slate">Người nhận</dt>
                <dd className="font-semibold text-ink">
                  {order.recipient?.name ?? '—'} · {order.recipient?.phone ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Tài khoản đặt</dt>
                <dd className="font-semibold text-ink">
                  {order.customer?.full_name ?? order.customer?.email ?? 'Khách vãng lai'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate">Địa chỉ giao</dt>
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
                <div className="sm:col-span-2">
                  <dt className="text-slate">Ghi chú của khách</dt>
                  <dd className="text-ink">{order.note}</dd>
                </div>
              ) : null}
              {order.cancel_reason ? (
                <div className="sm:col-span-2">
                  <dt className="text-slate">Lý do hủy</dt>
                  <dd className="text-ink">{order.cancel_reason}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section
            aria-labelledby="admin-order-items-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="admin-order-items-title" className="font-heading text-h5 text-ink">
              Sản phẩm ({order.item_count ?? items.length})
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-body-s">
                <thead>
                  <tr className="border-b border-fog text-left text-caption uppercase tracking-wide text-slate">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Sản phẩm
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Đơn giá
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      SL
                    </th>
                    <th scope="col" className="py-2 text-right font-semibold">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.order_item_id} className="border-b border-fog/70 last:border-b-0">
                      <td className="py-2 pr-3">
                        <p className="font-semibold text-ink">{item.product_name}</p>
                        <p className="text-caption text-slate">
                          {[item.variant_name, item.sku].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-ink">{formatVND(item.unit_price)}</td>
                      <td className="py-2 pr-3 text-ink">{item.quantity}</td>
                      <td className="py-2 text-right font-semibold text-ink">
                        {formatVND(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
                  <dt className="text-slate">Giảm giá {order.coupon_code ? `(${order.coupon_code})` : ''}</dt>
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
                <dd className="font-heading text-h5 text-primary">{formatVND(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          <OrderTrackingTimeline history={detail?.tracking_history ?? []} />
        </div>

        <aside className="space-y-5">
          <section
            aria-labelledby="admin-order-payment-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="admin-order-payment-title" className="font-heading text-h5 text-ink">
              Thanh toán & vận chuyển
            </h2>
            <dl className="mt-3 space-y-2 text-body-s">
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Phương thức</dt>
                <dd className="font-semibold text-ink">{order.payment_method_label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Trạng thái</dt>
                <dd className="font-semibold text-ink">
                  {PAYMENT_STATUS_LABELS[paymentInfo?.status ?? order.payment_status] ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Đã thanh toán lúc</dt>
                <dd className="text-ink">{formatDateTime(paymentInfo?.paid_at)}</dd>
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
            aria-labelledby="admin-order-status-title"
            className="rounded-md border border-fog bg-white p-5"
          >
            <h2 id="admin-order-status-title" className="font-heading text-h5 text-ink">
              Cập nhật trạng thái
            </h2>

            {transitionOptions.length === 0 ? (
              <p className="mt-2 text-body-s text-slate">
                Đơn ở trạng thái kết thúc — không còn bước chuyển hợp lệ.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <Select
                  id="admin-order-next-status"
                  label="Trạng thái mới"
                  placeholder="Chọn trạng thái"
                  options={transitionOptions}
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  disabled={updateMutation.isPending}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-order-note" className="text-body-s font-semibold text-ink">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    id="admin-order-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={updateMutation.isPending}
                    placeholder="VD: Đã gọi xác nhận với khách lúc 9h."
                    className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={submitTransition}
                  loading={updateMutation.isPending}
                >
                  Lưu trạng thái
                </Button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
