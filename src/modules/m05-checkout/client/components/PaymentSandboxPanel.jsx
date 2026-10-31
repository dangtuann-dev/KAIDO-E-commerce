'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — PaymentSandboxPanel
 * SRS: M05 | API/FR: M05-F07, API-M05-04 | BR: BR-M05-02
 * Route: /checkout/payment-sandbox/[orderRef]
 * UI: Mô phỏng cổng VNPAY ở môi trường dev (khi chưa có TMN_CODE/HASH_SECRET thật).
 * Gửi IPN đã ký sẵn lên API-M05-04 đúng như cổng thật gọi server-to-server.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatVND } from '@/shared/utils/formatVND.js';
import { useToast } from '@/shared/ui/toast.jsx';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import { formatDateTime } from '../utils/datetime.js';
import { useVnpayIpn } from '../hooks/use-vnpay-ipn.js';

const SUCCESS_CODES = new Set(['00', '02']);

/**
 * @param {{
 *   order: object,
 *   successFields: Record<string, string>,
 *   failureFields: Record<string, string>,
 * }} props
 */
export default function PaymentSandboxPanel({ order, successFields, failureFields }) {
  const router = useRouter();
  const toast = useToast();
  const ipnMutation = useVnpayIpn();

  async function sendIpn(fields, outcome) {
    try {
      const result = await ipnMutation.mutateAsync({ body: fields });
      const rspCode = result?.RspCode;

      if (SUCCESS_CODES.has(rspCode)) {
        toast.success(
          outcome === 'success'
            ? 'Cổng mô phỏng đã xác nhận thanh toán thành công.'
            : 'Cổng báo giao dịch đã được xử lý trước đó.',
        );
        router.replace(`/order-success/${encodeURIComponent(order.order_code)}`);
        return;
      }

      toast.warning(
        `Cổng mô phỏng trả mã ${rspCode ?? '—'}${result?.Message ? `: ${result.Message}` : ''}.`,
      );
      router.replace(`/order-success/${encodeURIComponent(order.order_code)}?payment=failed`);
    } catch (error) {
      toast.error(error?.message ?? 'Không gửi được kết quả thanh toán về hệ thống.');
    }
  }

  return (
    <div className="kaido-container max-w-3xl py-8 md:py-10">
      <div className="rounded-lg border border-accent-active/50 bg-accent/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">Môi trường mô phỏng</Badge>
          <span className="text-caption text-ink">
            Chưa cấu hình VNPAY_TMN_CODE / VNPAY_HASH_SECRET nên KAIDO dùng cổng giả lập nội bộ.
          </span>
        </div>
      </div>

      <section
        aria-labelledby="sandbox-title"
        className="mt-4 rounded-md border border-fog bg-white p-6 shadow-card"
      >
        <h1 id="sandbox-title" className="font-heading text-h3 text-ink">
          Cổng thanh toán VNPAY (giả lập)
        </h1>
        <p className="mt-1 text-body-s text-slate">
          Chọn kết quả mô phỏng để gửi IPN về KAIDO giống như cổng thật gọi server-to-server.
        </p>

        <dl className="mt-5 grid gap-3 border-y border-fog py-4 text-body-s sm:grid-cols-2">
          <div>
            <dt className="text-slate">Mã đơn hàng</dt>
            <dd className="font-semibold text-ink">{order.order_code}</dd>
          </div>
          <div>
            <dt className="text-slate">Số tiền</dt>
            <dd className="font-heading text-h5 text-primary">{formatVND(order.total_amount)}</dd>
          </div>
          <div>
            <dt className="text-slate">Hạn thanh toán</dt>
            <dd className="font-semibold text-ink">{formatDateTime(order.payment_expires_at)}</dd>
          </div>
          <div>
            <dt className="text-slate">Trạng thái hiện tại</dt>
            <dd className="font-semibold text-ink">
              {order.status_label} · {order.payment_method_label}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="accent"
            size="lg"
            className="sm:flex-1"
            loading={ipnMutation.isPending}
            onClick={() => sendIpn(successFields, 'success')}
          >
            Thanh toán thành công
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="sm:flex-1"
            disabled={ipnMutation.isPending}
            onClick={() => sendIpn(failureFields, 'failure')}
          >
            Thanh toán thất bại
          </Button>
        </div>

        <p className="mt-4 text-caption text-slate">
          Đây là trang chỉ dành cho phát triển. Khi cấu hình cổng VNPAY thật, trang này tự động đóng.
        </p>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-body-s">
        <Link href={`/order-success/${encodeURIComponent(order.order_code)}`} className="text-primary hover:underline">
          Xem trạng thái đơn hàng
        </Link>
        <span aria-hidden="true" className="text-fog">
          |
        </span>
        <Link href="/cart" className="text-slate hover:text-primary hover:underline">
          Quay lại giỏ hàng
        </Link>
      </div>
    </div>
  );
}
