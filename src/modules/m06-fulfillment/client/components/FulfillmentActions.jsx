'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — FulfillmentActions
 * SRS: M06-F05, M06-F06, M06-F07, M06-F09 | API: API-M05-07, API-M06-02, API-M06-03
 * Route: /admin/orders/[id]
 * UI: Xác nhận/đóng gói, tạo vận đơn, in phiếu giao (A5) và nhãn A6.
 */
import { useEffect, useState } from 'react';
import { cn } from '@/shared/utils/cn.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@/shared/constants/order-status.js';
import { PAYMENT_METHODS } from '@/shared/constants/payment.js';
import { CARRIER_OPTIONS, SHIPMENT_STATUS_TONES } from '../constants.js';
import { useCreateFulfillment } from '../hooks/use-create-fulfillment.js';
import { useGetOrderTracking } from '../hooks/use-get-order-tracking.js';
import { useUpdateOrderStatus } from '../hooks/use-update-order-status.js';
import { formatDateTime } from '../utils/datetime.js';

const FULFILLMENT_ROLES = ['ADMIN', 'STAFF', 'WAREHOUSE_KEEPER'];
const ORDER_MANAGER_ROLES = ['ADMIN', 'STAFF'];
const CONFIRMABLE_STATUSES = [
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PENDING_APPROVAL,
];

function PrintPackingSlip({ order, items = [] }) {
  return (
    <div className="w-full bg-white p-6 text-ink">
      <header className="flex items-start justify-between gap-4 border-b border-ink/20 pb-3">
        <div>
          <p className="font-heading text-h4 font-bold">KAIDO</p>
          <p className="text-caption">Đồ chơi cho bé yêu</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-h5">PHIẾU GIAO HÀNG</p>
          <p className="text-caption">Mã đơn: {order.order_code}</p>
          <p className="text-caption">In lúc: {formatDateTime(new Date())}</p>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-4 text-body-s">
        <div>
          <p className="font-semibold">Người nhận</p>
          <p>{order.recipient?.name ?? '—'}</p>
          <p>{order.recipient?.phone ?? '—'}</p>
          <p>
            {[
              order.recipient?.address_line,
              order.recipient?.ward,
              order.recipient?.district,
              order.recipient?.province,
            ]
              .filter(Boolean)
              .join(', ') || '—'}
          </p>
        </div>
        <div>
          <p className="font-semibold">Thanh toán</p>
          <p>{order.payment_method_label ?? '—'}</p>
          <p className="font-semibold">Tổng: {formatVND(order.total_amount)}</p>
          <p>Hình thức giao: {order.shipping_method_label ?? '—'}</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-body-s">
        <thead>
          <tr className="border-y border-ink/20 text-left">
            <th className="py-2">Sản phẩm</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-center">SL</th>
            <th className="py-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.order_item_id} className="border-b border-ink/10">
              <td className="py-2">
                {item.product_name}
                {item.variant_name ? ` · ${item.variant_name}` : ''}
              </td>
              <td className="py-2">{item.sku ?? '—'}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{formatVND(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.note ? <p className="mt-3 text-body-s">Ghi chú: {order.note}</p> : null}

      <div className="mt-8 grid grid-cols-2 gap-8 text-center text-body-s">
        <div>
          <p className="font-semibold">Người lập phiếu</p>
          <p className="mt-12 text-caption text-slate">(Ký, ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="font-semibold">Người nhận hàng</p>
          <p className="mt-12 text-caption text-slate">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
}

function PrintShippingLabel({ order, tracking }) {
  return (
    <div className="mx-auto w-full max-w-[105mm] border-2 border-ink bg-white p-4 text-ink">
      <div className="flex items-start justify-between gap-2 border-b border-ink/30 pb-2">
        <div>
          <p className="font-heading text-h5 font-bold">KAIDO</p>
          <p className="text-caption">{tracking?.carrier_label ?? order.carrier_code ?? '—'}</p>
        </div>
        <p className="text-caption font-semibold">A6 · DÁN NGOÀI KIỆN</p>
      </div>

      <div className="mt-3 text-center">
        <p className="text-caption uppercase tracking-wide">Mã vận đơn</p>
        <p className="font-heading text-h3 font-bold">{tracking?.tracking_code ?? '—'}</p>
        <p className="text-caption">Đơn hàng: {order.order_code}</p>
      </div>

      <div className="mt-3 border-t border-ink/20 pt-2 text-body-s">
        <p className="font-semibold">Người nhận: {order.recipient?.name ?? '—'}</p>
        <p>SĐT: {order.recipient?.phone ?? '—'}</p>
        <p>
          Địa chỉ:{' '}
          {[
            order.recipient?.address_line,
            order.recipient?.ward,
            order.recipient?.district,
            order.recipient?.province,
          ]
            .filter(Boolean)
            .join(', ') || '—'}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink/20 pt-2 text-body-s">
        <span>{order.payment_method_label ?? '—'}</span>
        <span className="font-heading text-h5 font-bold">
          {order.payment_method === PAYMENT_METHODS.COD
            ? `COD: ${formatVND(order.total_amount)}`
            : `Đã thanh toán: ${formatVND(order.total_amount)}`}
        </span>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   order?: object | null,
 *   items?: object[],
 *   onUpdated?: () => void,
 *   className?: string,
 * }} props
 */
export default function FulfillmentActions({ order, items = [], onUpdated, className }) {
  const toast = useToast();
  const user = useAuthStore(selectAuthUser);
  const createMutation = useCreateFulfillment();
  const statusMutation = useUpdateOrderStatus();
  const trackingQuery = useGetOrderTracking(
    { orderRef: order?.order_code ?? '' },
    { enabled: Boolean(order?.order_code) },
  );

  const [carrier, setCarrier] = useState(order?.carrier_code ?? 'GHN');
  const [pickupTime, setPickupTime] = useState('');
  const [printMode, setPrintMode] = useState(null);

  useEffect(() => {
    if (!printMode) return undefined;
    const reset = () => setPrintMode(null);
    const timer = setTimeout(reset, 3000);
    window.addEventListener('afterprint', reset);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('afterprint', reset);
    };
  }, [printMode]);

  if (!order) return null;

  const tracking = trackingQuery.data ?? null;
  const canFulfill = FULFILLMENT_ROLES.includes(user?.role);
  const canManageOrder = ORDER_MANAGER_ROLES.includes(user?.role);
  const canConfirm = canManageOrder && CONFIRMABLE_STATUSES.includes(order.status);
  const canPack = canManageOrder && order.status === ORDER_STATUS.CONFIRMED;
  const canCreateShipment = canFulfill && order.status === ORDER_STATUS.PACKING;

  async function transition(newStatus) {
    try {
      const result = await statusMutation.mutateAsync({
        id: order.order_id,
        body: { new_status: newStatus },
      });
      toast.success(`Đã cập nhật: ${result?.status_label ?? ORDER_STATUS_LABELS[newStatus]}`);
      onUpdated?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không thể cập nhật trạng thái đơn.');
    }
  }

  async function createShipment() {
    try {
      const result = await createMutation.mutateAsync({
        orderRef: order.order_code,
        body: {
          carrier_code: carrier,
          pickup_time: pickupTime ? new Date(pickupTime).toISOString() : undefined,
        },
      });
      toast.success(`Đã tạo vận đơn ${result?.tracking_code ?? ''} qua ${result?.carrier_label ?? carrier}.`);
      setPickupTime('');
      await trackingQuery.refetch();
      onUpdated?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không thể tạo vận đơn.');
    }
  }

  return (
    <section
      aria-labelledby="fulfillment-actions-title"
      className={cn('rounded-md border border-fog bg-white p-5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="fulfillment-actions-title" className="font-heading text-h5 text-ink">
          Xử lý giao vận
        </h2>
        <Badge tone="info">{order.status_label ?? ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      {canConfirm || canPack ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canConfirm ? (
            <Button
              size="sm"
              onClick={() => transition(ORDER_STATUS.CONFIRMED)}
              loading={statusMutation.isPending}
            >
              Xác nhận đơn
            </Button>
          ) : null}
          {canPack ? (
            <Button
              size="sm"
              onClick={() => transition(ORDER_STATUS.PACKING)}
              loading={statusMutation.isPending}
            >
              Bắt đầu đóng gói
            </Button>
          ) : null}
        </div>
      ) : null}

      {canCreateShipment ? (
        <div className="mt-4 space-y-3 border-t border-fog pt-3">
          <p className="text-body-s text-slate">
            Đơn đã đóng gói. Chọn đơn vị vận chuyển để sinh mã vận đơn và xuất kho thực tế.
          </p>
          <Select
            id="fulfillment-carrier"
            label="Đơn vị vận chuyển"
            options={CARRIER_OPTIONS}
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            disabled={createMutation.isPending}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fulfillment-pickup-time" className="text-body-s font-semibold text-ink">
              Giờ lấy hàng dự kiến (không bắt buộc)
            </label>
            <input
              id="fulfillment-pickup-time"
              type="datetime-local"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
              disabled={createMutation.isPending}
              className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40"
            />
          </div>
          <Button
            className="w-full"
            onClick={createShipment}
            loading={createMutation.isPending}
          >
            Tạo vận đơn & bàn giao
          </Button>
        </div>
      ) : null}

      {tracking?.tracking_code ? (
        <div className="mt-4 space-y-2 border-t border-fog pt-3 text-body-s">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate">Mã vận đơn</span>
            <span className="font-heading text-h6 text-primary">{tracking.tracking_code}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate">Hãng vận chuyển</span>
            <span className="font-semibold text-ink">{tracking.carrier_label}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate">Trạng thái vận đơn</span>
            <Badge tone={SHIPMENT_STATUS_TONES[tracking.current_status] ?? 'neutral'}>
              {tracking.current_status_label ?? '—'}
            </Badge>
          </div>
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <Button variant="outline" size="sm" onClick={() => setPrintMode('PACKING')}>
              In phiếu giao (A5)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPrintMode('LABEL')}>
              In nhãn A6
            </Button>
          </div>
        </div>
      ) : null}

      {!canFulfill ? (
        <p className="mt-3 text-body-s text-slate">
          Tài khoản hiện tại không có quyền xử lý giao vận cho đơn này.
        </p>
      ) : null}

      {printMode ? (
        <div id="kaido-print-area" className="hidden print:block">
          {printMode === 'PACKING' ? (
            <PrintPackingSlip order={order} items={items} />
          ) : (
            <PrintShippingLabel order={order} tracking={tracking} />
          )}
        </div>
      ) : null}
    </section>
  );
}
