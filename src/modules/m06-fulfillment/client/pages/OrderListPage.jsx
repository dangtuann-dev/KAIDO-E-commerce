'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — OrderListPage
 * SRS: M06-F01, M06-F02 | API: API-M05-08, API-M06-05 | BR: BR-M05-04
 * Route: /account/orders
 * UI: Lịch sử đơn của khách, lọc trạng thái, phân trang và hủy đơn khi còn được phép.
 */
import { useState } from 'react';
import Link from 'next/link';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
} from '@/shared/constants/order-status.js';
import { PAYMENT_STATUS_LABELS } from '@/shared/constants/payment.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { useListMyOrders } from '../hooks/use-list-my-orders.js';
import { ORDER_STATUS_TONES, PAYMENT_STATUS_TONES } from '../constants.js';
import { formatDateTime, remainingReturnDays } from '../utils/datetime.js';
import CancelOrderModal from '../components/CancelOrderModal.jsx';

const DEFAULT_LIMIT = 10;
const RETURN_WINDOW_DAYS = BUSINESS_RULES.SHIPPING.RETURN_WINDOW_DAYS;

const STATUS_OPTIONS = ORDER_STATUS_VALUES.map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status] ?? status,
}));

const INITIAL_FILTERS = Object.freeze({ page: 1, status: '' });

export default function OrderListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const variables = { page: filters.page, limit: DEFAULT_LIMIT };
  if (filters.status) variables.status = filters.status;

  const query = useListMyOrders(variables);
  const data = query.data ?? null;
  const orders = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, total_pages: 1, total: 0 };

  function refresh() {
    query.refetch();
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Đơn hàng của tôi</h1>
          <p className="mt-1 text-body-s text-slate">
            {pagination.total ?? 0} đơn hàng. Theo dõi giao vận và yêu cầu đổi trả trong 7 ngày
            (BR-M06-05).
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            id="my-order-status"
            label="Lọc trạng thái"
            placeholder="Tất cả trạng thái"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(event) => setFilters({ page: 1, status: event.target.value })}
            disabled={query.isFetching}
          />
        </div>
      </header>

      <div className="rounded-sm bg-surface-sky/60 px-4 py-3 text-body-s text-slate">
        Không thấy đơn vãng lai? Hãy đăng nhập đúng tài khoản đã dùng khi đặt hàng hoặc{' '}
        <Link href="/account/support" className="kaido-link font-semibold">
          liên hệ CSKH
        </Link>
        .
      </div>

      {query.isError ? (
        <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-5">
          <p className="text-body-s font-semibold text-sale">Không tải được danh sách đơn hàng</p>
          <p className="mt-1 text-body-s text-slate">
            {query.error?.message ?? 'Vui lòng thử lại sau ít phút.'}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
            Thử lại
          </Button>
        </div>
      ) : query.isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-32 w-full" rounded="md" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description={
            filters.status
              ? 'Không đơn nào ở trạng thái này. Thử chọn "Tất cả trạng thái".'
              : 'Đơn hàng bạn đặt sẽ xuất hiện tại đây để theo dõi và đổi trả.'
          }
          action={
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Tiếp tục mua sắm
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const canReturn =
              order.status === ORDER_STATUS.COMPLETED &&
              remainingReturnDays(order.completed_at, RETURN_WINDOW_DAYS) > 0;

            return (
              <li
                key={order.order_id}
                className="rounded-md border border-fog bg-white p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-fog pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.order_code)}`}
                        className="font-heading text-h5 text-primary hover:underline"
                      >
                        {order.order_code}
                      </Link>
                      <Badge tone={ORDER_STATUS_TONES[order.status] ?? 'neutral'}>
                        {order.status_label}
                      </Badge>
                      <Badge tone={PAYMENT_STATUS_TONES[order.payment_status] ?? 'neutral'}>
                        {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-caption text-slate">
                      Đặt lúc {formatDateTime(order.placed_at ?? order.created_at)} ·{' '}
                      {order.payment_method_label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption text-slate">Tổng thanh toán</p>
                    <p className="font-heading text-price text-primary">
                      {formatVND(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky">
                    {order.first_item?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.first_item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-s font-semibold text-ink">
                      {order.first_item?.name ?? 'Đơn hàng'}
                    </p>
                    <p className="text-caption text-slate">
                      {order.first_item?.variant_name
                        ? `${order.first_item.variant_name} · `
                        : ''}
                      {order.item_count} sản phẩm
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    {canReturn ? (
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.order_code)}/return`}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog px-4 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
                      >
                        Đổi trả
                      </Link>
                    ) : null}
                    {order.can_cancel ? (
                      <CancelOrderModal
                        orderRef={order.order_code}
                        orderCode={order.order_code}
                        status={order.status}
                        isPaid={order.is_paid}
                        onCancelled={refresh}
                        className="w-auto"
                      />
                    ) : null}
                    <Link
                      href={`/account/orders/${encodeURIComponent(order.order_code)}`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-4 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={pagination.page ?? 1}
        totalPages={pagination.total_pages ?? 1}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        disabled={query.isFetching}
      />
    </div>
  );
}
