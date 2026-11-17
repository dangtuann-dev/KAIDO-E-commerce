'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — BankTransferPage
 * SRS: M05 | API/FR: M05-F04, M05-F07, M05-F08, API-M05-03 | BR: BR-M05-02
 * Route: /checkout/bank-transfer/[orderRef]
 * Render: Client Component. Hiển thị VietQR + nội dung chuyển khoản, poll trạng thái tới khi tiền vào.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatVND } from '@/shared/utils/formatVND.js';
import { useToast } from '@/shared/ui/toast.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { ORDER_STATUS } from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS } from '@/shared/constants/payment.js';
import { formatDateTime, formatDuration, remainingMs } from '../utils/datetime.js';
import { useGetOrderDetail } from '../hooks/use-get-order-detail.js';

const POLL_INTERVAL_MS = 5000;

function TransferRow({ label, value, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-fog py-2.5 last:border-b-0">
      <div className="min-w-0">
        <dt className="text-caption text-slate">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-ink">{value}</dd>
      </div>
      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-sm border border-fog px-2.5 py-1 text-caption font-semibold text-primary transition-colors duration-250 hover:border-primary hover:bg-surface-sky"
        >
          Copy
        </button>
      ) : null}
    </div>
  );
}

export default function BankTransferPage() {
  const params = useParams();
  const orderRef = typeof params?.orderRef === 'string' ? decodeURIComponent(params.orderRef) : '';
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const detailQuery = useGetOrderDetail(
    { orderRef },
    {
      enabled: Boolean(orderRef),
      // Tiền về do webhook/nhân viên xác nhận — poll tới khi đơn thoát PENDING_PAYMENT.
      refetchInterval: (query) => {
        const current = query?.state?.data?.order;
        if (!current) return false;
        if (current.payment_status === PAYMENT_STATUS.SUCCESS) return false;
        return current.status === ORDER_STATUS.PENDING_PAYMENT ? POLL_INTERVAL_MS : false;
      },
    },
  );

  const detail = detailQuery.data ?? null;
  const order = detail?.order ?? null;
  const paymentInfo = detail?.payment_info ?? null;
  const transfer = paymentInfo?.bank_transfer ?? null;
  const isWaiting = order?.status === ORDER_STATUS.PENDING_PAYMENT;
  const isPaid = order?.payment_status === PAYMENT_STATUS.SUCCESS;
  const isCancelled =
    order?.status === ORDER_STATUS.CANCELLED || order?.status === ORDER_STATUS.CANCELLED_TIMEOUT;

  useEffect(() => {
    if (!isWaiting) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isWaiting]);

  const expiresAt = order?.payment_expires_at ?? paymentInfo?.expires_at ?? null;
  const left = remainingMs(expiresAt, now);
  const expired = isWaiting && expiresAt ? left <= 0 : false;

  async function copyValue(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã copy ${label.toLowerCase()}.`);
    } catch {
      toast.error('Trình duyệt không cho phép copy tự động. Vui lòng chép tay.');
    }
  }

  if (!orderRef) {
    return (
      <div className="kaido-container py-8 md:py-10">
        <EmptyState
          title="Thiếu mã đơn hàng"
          description="Đường dẫn không chứa mã đơn cần thanh toán."
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" rounded="md" />
      </div>
    );
  }

  if (detailQuery.isError || !order) {
    return (
      <div className="kaido-container py-8 md:py-10">
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description={
            detailQuery.error?.message ?? 'Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn này.'
          }
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

  return (
    <div className="kaido-container max-w-3xl space-y-4 py-8 md:py-10">
      <header>
        <nav aria-label="Breadcrumb" className="text-caption text-slate">
          <Link href="/account/orders" className="hover:text-primary hover:underline">
            Đơn hàng của tôi
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span className="font-semibold text-ink">{order.order_code}</span>
        </nav>
        <h1 className="mt-1 font-heading text-h2 text-ink">Chuyển khoản ngân hàng</h1>
        <p className="mt-1 text-body-s text-slate">
          Quét mã VietQR hoặc chuyển khoản đúng số tiền và nội dung bên dưới.
        </p>
      </header>

      {isPaid ? (
        <section className="rounded-md border border-fog bg-white p-6 text-center shadow-card">
          <p className="font-heading text-h4 text-success">Đã nhận thanh toán</p>
          <p className="mt-1 text-body-s text-slate">
            KAIDO đã ghi nhận tiền cho đơn {order.order_code} và sẽ đóng gói trong thời gian sớm nhất.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/account/orders/${encodeURIComponent(order.order_code)}`}
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
          </div>
        </section>
      ) : isCancelled || expired ? (
        <section className="rounded-md border border-fog bg-white p-6 text-center shadow-card">
          <p className="font-heading text-h4 text-sale">
            {isCancelled ? 'Đơn hàng đã hủy' : 'Đã hết thời gian giữ tồn'}
          </p>
          <p className="mt-1 text-body-s text-slate">
            {isCancelled
              ? 'Đơn đã hủy nên không thể thanh toán. Nếu bạn đã chuyển tiền, vui lòng liên hệ KAIDO để được hoàn.'
              : 'Hệ thống sẽ tự động hủy đơn và trả lại tồn kho. Vui lòng đặt lại đơn mới.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/account/orders/${encodeURIComponent(order.order_code)}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
            >
              Xem đơn hàng
            </Link>
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Đặt lại đơn mới
            </Link>
          </div>
        </section>
      ) : transfer ? (
        <section
          aria-labelledby="bank-transfer-title"
          className="rounded-md border border-fog bg-white p-5 shadow-card md:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="bank-transfer-title" className="font-heading text-h5 text-ink">
              Quét VietQR để thanh toán
            </h2>
            <span className="rounded-full bg-accent/20 px-3 py-1 text-caption font-semibold text-ink">
              Còn {formatDuration(left)}
            </span>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:items-start">
            <div className="mx-auto w-full max-w-[240px]">
              <Image
                src={transfer.qr_url}
                alt={`Mã VietQR thanh toán đơn ${order.order_code}`}
                width={480}
                height={640}
                unoptimized
                className="h-auto w-full rounded-sm border border-fog bg-white"
              />
              <p className="mt-2 text-center text-caption text-slate">
                Mở app ngân hàng → quét QR → kiểm tra số tiền và nội dung.
              </p>
            </div>

            <dl className="text-body-s">
              <TransferRow label="Ngân hàng" value={transfer.bank_name} />
              <TransferRow
                label="Số tài khoản"
                value={transfer.account_no}
                onCopy={() => copyValue('số tài khoản', transfer.account_no)}
              />
              <TransferRow label="Chủ tài khoản" value={transfer.account_name} />
              <TransferRow
                label="Số tiền"
                value={formatVND(transfer.amount)}
                onCopy={() => copyValue('số tiền', String(transfer.amount))}
              />
              <TransferRow
                label="Nội dung chuyển khoản"
                value={transfer.memo}
                onCopy={() => copyValue('nội dung chuyển khoản', transfer.memo)}
              />
            </dl>
          </div>

          <div className="mt-4 rounded-sm border border-accent-active/40 bg-accent/10 px-4 py-3 text-body-s text-ink">
            <p className="font-semibold">Lưu ý quan trọng</p>
            <ul className="mt-1 space-y-1">
              <li>• Chuyển đúng số tiền và giữ nguyên nội dung, hệ thống đối chiếu theo mã đơn.</li>
              <li>• Tiền vào tài khoản thường mất 1–5 phút; trang này tự cập nhật khi nhận được.</li>
              <li>• Hạn thanh toán: {formatDateTime(expiresAt)}. Quá hạn, đơn tự hủy và trả tồn kho.</li>
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => detailQuery.refetch()}
              loading={detailQuery.isFetching}
            >
              Tôi đã chuyển khoản
            </Button>
            <Link
              href={`/account/orders/${encodeURIComponent(order.order_code)}`}
              className="text-body-s font-semibold text-primary hover:underline"
            >
              Xem chi tiết đơn hàng
            </Link>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Chưa cấu hình tài khoản nhận tiền"
          description="KAIDO chưa thiết lập tài khoản ngân hàng cho phương thức này. Vui lòng chọn thanh toán khi nhận hàng (COD) hoặc liên hệ hỗ trợ."
          action={
            <Link
              href={`/account/orders/${encodeURIComponent(order.order_code)}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Xem đơn hàng
            </Link>
          }
        />
      )}
    </div>
  );
}
