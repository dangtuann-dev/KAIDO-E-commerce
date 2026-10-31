'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSuccessPage
 * SRS: M05 | API/FR: M05-F08, M05-F09, API-M05-03, API-M05-05 | BR: BR-M05-02, BR-M05-04
 * Route: /order-success/[code]
 * Render: Client Component. Poll trạng thái thanh toán online cho tới khi cổng xác nhận.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatVND } from '@/shared/utils/formatVND.js';
import { useToast } from '@/shared/ui/toast.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { ORDER_STATUS } from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS } from '@/shared/constants/payment.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import OrderSuccessCard from '../components/OrderSuccessCard.jsx';
import OrderTrackingTimeline from '../components/OrderTrackingTimeline.jsx';
import { formatDateTime } from '../utils/datetime.js';
import { useCancelOrder } from '../hooks/use-cancel-order.js';
import { useGetOrderDetail } from '../hooks/use-get-order-detail.js';

const POLL_INTERVAL_MS = 5000;
const CANCEL_REASON_MIN_LENGTH = 5;

function OrderItemsList({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="order-items-title"
      className="rounded-md border border-fog bg-white p-5"
    >
      <h2 id="order-items-title" className="font-heading text-h5 text-ink">
        Sản phẩm trong đơn
      </h2>
      <ul className="mt-3 divide-y divide-fog">
        {items.map((item) => (
          <li key={item.order_item_id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-body-s font-semibold text-ink">{item.product_name}</p>
              <p className="text-caption text-slate">
                {[item.variant_name, item.sku].filter(Boolean).join(' · ') || 'Phân loại mặc định'}
              </p>
              <p className="mt-1 text-caption text-slate">
                {formatVND(item.unit_price)} × {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-body-s font-semibold text-ink">
              {formatVND(item.line_total)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OrderSuccessPage() {
  const params = useParams();
  const code = typeof params?.code === 'string' ? decodeURIComponent(params.code) : '';
  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const detailQuery = useGetOrderDetail(
    { orderRef: code },
    {
      enabled: Boolean(code),
      // Chỉ poll khi đơn còn chờ thanh toán; dừng ngay khi cổng đã xác nhận (BR-M05-02).
      refetchInterval: (query) => {
        const current = query?.state?.data?.order;
        if (!current) return false;
        if (current.payment_status === PAYMENT_STATUS.SUCCESS) return false;
        return current.status === ORDER_STATUS.PENDING_PAYMENT ? POLL_INTERVAL_MS : false;
      },
    },
  );

  const cancelMutation = useCancelOrder();

  const detail = detailQuery.data ?? null;
  const order = detail?.order ?? null;
  const paymentInfo = detail?.payment_info ?? null;

  const nextSteps = useMemo(() => {
    if (!order) return [];
    if (order.payment_status === PAYMENT_STATUS.SUCCESS) {
      return ['Đơn đã thanh toán, KAIDO sẽ đóng gói và giao trong 2–4 ngày làm việc.'];
    }
    if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
      return [
        'Vui lòng hoàn tất thanh toán trong thời gian giữ tồn trên trang này.',
        'Quá hạn, đơn sẽ tự động hủy và tồn kho được trả lại.',
      ];
    }
    if (order.status === ORDER_STATUS.PENDING_APPROVAL) {
      return ['Đơn COD giá trị lớn cần nhân viên xác nhận trước khi giao.'];
    }
    return ['KAIDO sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.'];
  }, [order]);

  const sandboxHref =
    paymentInfo?.payment_mode === 'sandbox' &&
    order?.status === ORDER_STATUS.PENDING_PAYMENT &&
    !order?.is_paid
      ? `/checkout/payment-sandbox/${encodeURIComponent(order.order_code)}`
      : null;

  async function submitCancel() {
    if (reason.trim().length < CANCEL_REASON_MIN_LENGTH) {
      toast.error(`Lý do hủy tối thiểu ${CANCEL_REASON_MIN_LENGTH} ký tự.`);
      return;
    }

    try {
      await cancelMutation.mutateAsync({ orderRef: order?.order_code ?? code, body: { reason: reason.trim() } });
      toast.success('Đã hủy đơn hàng. Tồn kho sẽ được trả lại.');
      setCancelOpen(false);
      setReason('');
      await detailQuery.refetch();
    } catch (error) {
      if (error?.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
        toast.error('Đơn hàng đã chuyển sang trạng thái không thể hủy.');
        setCancelOpen(false);
        await detailQuery.refetch();
        return;
      }
      toast.error(error?.message ?? 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    }
  }

  if (!code) {
    return (
      <div className="kaido-container py-8 md:py-10">
        <EmptyState
          title="Thiếu mã đơn hàng"
          description="Đường dẫn không chứa mã đơn. Vui lòng mở đơn hàng từ trang tài khoản."
          action={
            <Link
              href="/account/orders"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Xem đơn hàng của tôi
            </Link>
          }
        />
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="kaido-container max-w-3xl space-y-4 py-8 md:py-10">
        <Skeleton className="h-72 w-full" rounded="md" />
        <Skeleton className="h-40 w-full" rounded="md" />
      </div>
    );
  }

  if (detailQuery.isError || !order) {
    return (
      <div className="kaido-container py-8 md:py-10">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description={
            detailQuery.error?.message ??
            'Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn này.'
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/account/orders"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
              >
                Xem đơn hàng của tôi
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="kaido-container max-w-3xl space-y-4 py-8 md:py-10">
      <OrderSuccessCard
        order={order}
        paymentInfo={paymentInfo}
        nextSteps={nextSteps}
        cancelling={cancelMutation.isPending}
        onCancel={() => setCancelOpen(true)}
        sandboxHref={sandboxHref}
      />

      <OrderItemsList items={detail?.order_items ?? []} />

      <OrderTrackingTimeline history={detail?.tracking_history ?? []} />

      {paymentInfo?.transactions?.length > 0 ? (
        <section
          aria-labelledby="order-payments-title"
          className="rounded-md border border-fog bg-white p-5"
        >
          <h2 id="order-payments-title" className="font-heading text-h5 text-ink">
            Giao dịch thanh toán
          </h2>
          <ul className="mt-3 space-y-2 text-body-s">
            {paymentInfo.transactions.map((transaction) => (
              <li
                key={transaction.transaction_id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="font-semibold text-ink">
                  {transaction.provider} · {formatVND(transaction.amount)}
                </span>
                <span className="text-caption text-slate">
                  {transaction.status} · {formatDateTime(transaction.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal
        open={cancelOpen}
        onClose={() => {
          if (cancelMutation.isPending) return;
          setCancelOpen(false);
        }}
        title="Hủy đơn hàng"
        description="Đơn đã hủy không thể khôi phục. Tồn kho sẽ được trả lại ngay."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCancelOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Giữ đơn hàng
            </Button>
            <Button variant="danger" onClick={submitCancel} loading={cancelMutation.isPending}>
              Xác nhận hủy
            </Button>
          </>
        }
      >
        <label htmlFor="cancel-reason" className="text-body-s font-semibold text-ink">
          Lý do hủy
        </label>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="VD: Tôi muốn đổi sang phân loại khác."
          className="mt-1.5 block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-caption text-slate">
          Tối thiểu {CANCEL_REASON_MIN_LENGTH} ký tự. Hiện có {reason.trim().length}/500.
        </p>
      </Modal>
    </div>
  );
}
