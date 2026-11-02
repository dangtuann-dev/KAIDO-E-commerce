'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderTable
 * SRS: M05-F11, M06-F05 | API: API-M05-06 | BR: BR-M06-01
 * Route: /admin/orders
 * UI: Bảng đơn có lọc trạng thái, từ khóa, khoảng ngày; badge trạng thái và liên kết chi tiết.
 */
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS_LABELS } from '@/shared/constants/payment.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import { formatDateTime } from '../utils/datetime.js';

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

const STATUS_OPTIONS = ORDER_STATUS_VALUES.map((value) => ({
  value,
  label: ORDER_STATUS_LABELS[value] ?? value,
}));

/**
 * @param {{
 *   orders?: object[],
 *   loading?: boolean,
 *   error?: string | null,
 *   filters: { status?: string, search?: string, from_date?: string, to_date?: string },
 *   onFiltersChange?: (patch: object) => void,
 *   statusCounts?: Record<string, number>,
 *   totalOrders?: number,
 *   onRefresh?: () => void,
 * }} props
 */
export default function AdminOrderTable({
  orders = [],
  loading = false,
  error = null,
  filters,
  onFiltersChange,
  statusCounts = {},
  totalOrders = 0,
  onRefresh,
}) {
  const hasFilters = Boolean(filters.status || filters.search || filters.from_date || filters.to_date);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-fog bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_160px_160px_auto] md:items-end">
          <Input
            id="admin-order-search"
            label="Tìm kiếm"
            placeholder="Mã đơn, tên, SĐT, email"
            value={filters.search ?? ''}
            onChange={(event) => onFiltersChange?.({ search: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Select
            id="admin-order-status"
            label="Trạng thái"
            placeholder="Tất cả trạng thái"
            options={STATUS_OPTIONS}
            value={filters.status ?? ''}
            onChange={(event) => onFiltersChange?.({ status: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Input
            id="admin-order-from"
            label="Từ ngày"
            type="date"
            value={filters.from_date ?? ''}
            onChange={(event) => onFiltersChange?.({ from_date: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Input
            id="admin-order-to"
            label="Đến ngày"
            type="date"
            value={filters.to_date ?? ''}
            onChange={(event) => onFiltersChange?.({ to_date: event.target.value, page: 1 })}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                onFiltersChange?.({ status: '', search: '', from_date: '', to_date: '', page: 1 })
              }
              disabled={loading || !hasFilters}
            >
              Xóa lọc
            </Button>
            {onRefresh ? (
              <Button variant="ghost" onClick={onRefresh} loading={loading}>
                Làm mới
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-slate">
          <span className="font-semibold text-ink">Tổng {totalOrders} đơn</span>
          {Object.entries(statusCounts)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <button
                key={status}
                type="button"
                onClick={() => onFiltersChange?.({ status, page: 1 })}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-fog px-2.5 font-semibold text-slate transition-colors duration-250 hover:border-primary hover:text-primary"
              >
                {ORDER_STATUS_LABELS[status] ?? status}
                <span className="text-ink">{count}</span>
              </button>
            ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-5">
          <p className="text-body-s font-semibold text-sale">Không tải được danh sách đơn</p>
          <p className="mt-1 text-body-s text-slate">{error}</p>
        </div>
      ) : loading && orders.length === 0 ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-14 w-full" rounded="sm" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description={
            hasFilters
              ? 'Không đơn nào khớp bộ lọc hiện tại. Thử xóa lọc để xem toàn bộ.'
              : 'Đơn mới từ khách hàng sẽ xuất hiện tại đây.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-fog bg-white">
          <table className="min-w-[880px] w-full border-collapse text-left text-body-s">
            <caption className="sr-only">Danh sách đơn hàng</caption>
            <thead>
              <tr className="border-b border-fog bg-surface-sky/40 text-caption uppercase tracking-wide text-slate">
                <th scope="col" className="px-4 py-3">
                  Mã đơn
                </th>
                <th scope="col" className="px-4 py-3">
                  Khách hàng
                </th>
                <th scope="col" className="px-4 py-3">
                  Ngày đặt
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Tổng tiền
                </th>
                <th scope="col" className="px-4 py-3">
                  Thanh toán
                </th>
                <th scope="col" className="px-4 py-3">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="border-b border-fog/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.order_id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {order.order_code}
                    </Link>
                    <p className="text-caption text-slate">{order.item_count} sản phẩm</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{order.customer?.full_name ?? order.recipient.name}</p>
                    <p className="text-caption text-slate">
                      {order.customer?.email ?? order.recipient.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate">{formatDateTime(order.placed_at)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    {formatVND(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-caption text-slate">{order.payment_method_label}</p>
                    <Badge tone={PAYMENT_TONES[order.payment_status] ?? 'neutral'}>
                      {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONES[order.status] ?? 'neutral'}>{order.status_label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.order_id}`}
                      className="inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
