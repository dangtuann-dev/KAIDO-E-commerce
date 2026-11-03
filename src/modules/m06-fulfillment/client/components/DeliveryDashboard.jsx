'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — DeliveryDashboard
 * SRS: M06-F10, M06-F11, M06-F14 | API: API-M06-09
 * Route: /admin/shipping
 * UI: Thống kê giao thành công/thất bại, bảng vận đơn theo ĐVVC/trạng thái và quản lý đổi trả.
 */
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { useListShipments } from '../hooks/use-list-shipments.js';
import {
  CARRIER_OPTIONS,
  SHIPMENT_STATUS_OPTIONS,
  SHIPMENT_STATUS_TONES,
} from '../constants.js';
import { formatDate, formatDateTime } from '../utils/datetime.js';
import ReturnRequestTable from './ReturnRequestTable.jsx';

const DEFAULT_LIMIT = 15;
const MAX_DELIVERY_ATTEMPTS = BUSINESS_RULES.SHIPPING.MAX_DELIVERY_ATTEMPTS;

const INITIAL_FILTERS = Object.freeze({
  page: 1,
  status: '',
  carrier_code: '',
  from_date: '',
  to_date: '',
});

function StatCard({ label, value, tone = 'ink', hint }) {
  return (
    <div className="rounded-md border border-fog bg-white px-4 py-3">
      <p className="text-caption text-slate">{label}</p>
      <p
        className={cn(
          'mt-1 font-heading text-h3 font-bold',
          tone === 'success' && 'text-success-strong',
          tone === 'danger' && 'text-sale',
          tone === 'primary' && 'text-primary',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-caption text-mist">{hint}</p> : null}
    </div>
  );
}

/**
 * @param {{ className?: string }} props
 */
export default function DeliveryDashboard({ className }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const variables = { page: filters.page, limit: DEFAULT_LIMIT };
  if (filters.status) variables.status = filters.status;
  if (filters.carrier_code) variables.carrier_code = filters.carrier_code;
  if (filters.from_date) variables.from_date = filters.from_date;
  if (filters.to_date) variables.to_date = filters.to_date;

  const query = useListShipments(variables);
  const data = query.data ?? null;
  const shipments = data?.items ?? [];
  const stats = data?.stats ?? null;
  const pagination = data?.pagination ?? { page: 1, total_pages: 1, total: 0 };
  const hasFilters = Boolean(
    filters.status || filters.carrier_code || filters.from_date || filters.to_date,
  );

  function patchFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className={cn('space-y-8', className)}>
      <section aria-labelledby="shipping-stats-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="shipping-stats-title" className="font-heading text-h4 text-ink">
              Thống kê giao hàng
            </h2>
            <p className="mt-1 text-body-s text-slate">
              Tỷ lệ giao thành công theo hãng vận chuyển và khoảng thời gian đã lọc.
            </p>
          </div>
          <Button variant="outline" onClick={() => query.refetch()} loading={query.isFetching}>
            Làm mới
          </Button>
        </div>

        {query.isLoading ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="h-20 w-full" rounded="md" />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Tổng vận đơn" value={stats?.total ?? 0} />
            <StatCard label="Đã giao" value={stats?.delivered ?? 0} tone="success" />
            <StatCard label="Thất bại / hoàn" value={stats?.failed ?? 0} tone="danger" />
            <StatCard label="Đang xử lý" value={stats?.active ?? 0} tone="primary" />
            <StatCard
              label="Tỷ lệ thành công"
              value={`${stats?.success_rate ?? 0}%`}
              tone="success"
            />
          </div>
        )}

        {stats?.by_carrier?.length ? (
          <div className="mt-3 flex flex-wrap gap-2 text-caption">
            {stats.by_carrier.map((carrier) => (
              <span
                key={carrier.carrier_code}
                className="inline-flex items-center gap-2 rounded-full border border-fog bg-white px-3 py-1.5"
              >
                <span className="font-semibold text-ink">{carrier.carrier_label}</span>
                <span className="text-slate">
                  {carrier.delivered}/{carrier.total} giao thành công ({carrier.success_rate}%)
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="shipment-list-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="shipment-list-title" className="font-heading text-h4 text-ink">
              Vận đơn
            </h2>
            <p className="mt-1 text-body-s text-slate">
              {pagination.total ?? 0} vận đơn. Webhook ĐVVC cập nhật trạng thái tự động.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-fog bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[200px_220px_160px_160px_auto] md:items-end">
            <Select
              id="shipment-status-filter"
              label="Trạng thái vận đơn"
              placeholder="Tất cả trạng thái"
              options={SHIPMENT_STATUS_OPTIONS}
              value={filters.status}
              onChange={(event) => patchFilters({ status: event.target.value, page: 1 })}
              disabled={query.isFetching}
            />
            <Select
              id="shipment-carrier-filter"
              label="Đơn vị vận chuyển"
              placeholder="Tất cả hãng"
              options={CARRIER_OPTIONS}
              value={filters.carrier_code}
              onChange={(event) => patchFilters({ carrier_code: event.target.value, page: 1 })}
              disabled={query.isFetching}
            />
            <Input
              id="shipment-from-date"
              label="Từ ngày"
              type="date"
              value={filters.from_date}
              onChange={(event) => patchFilters({ from_date: event.target.value, page: 1 })}
              disabled={query.isFetching}
            />
            <Input
              id="shipment-to-date"
              label="Đến ngày"
              type="date"
              value={filters.to_date}
              onChange={(event) => patchFilters({ to_date: event.target.value, page: 1 })}
              disabled={query.isFetching}
            />
            <Button
              variant="outline"
              onClick={() => setFilters(INITIAL_FILTERS)}
              disabled={query.isFetching || !hasFilters}
            >
              Xóa lọc
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {query.isError ? (
            <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-4">
              <p className="text-body-s font-semibold text-sale">Không tải được danh sách vận đơn</p>
              <p className="mt-1 text-body-s text-slate">
                {query.error?.message ?? 'Vui lòng thử lại sau.'}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : query.isLoading ? (
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-14 w-full" rounded="sm" />
              ))}
            </div>
          ) : shipments.length === 0 ? (
            <EmptyState
              title="Chưa có vận đơn nào"
              description={
                hasFilters
                  ? 'Không vận đơn nào khớp bộ lọc hiện tại. Thử xóa lọc để xem toàn bộ.'
                  : 'Vận đơn được tạo từ trang chi tiết đơn hàng sẽ xuất hiện tại đây.'
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-fog bg-white">
              <table className="w-full min-w-[980px] border-collapse text-left text-body-s">
                <caption className="sr-only">Danh sách vận đơn</caption>
                <thead>
                  <tr className="border-b border-fog bg-surface-sky/40 text-caption uppercase tracking-wide text-slate">
                    <th scope="col" className="px-4 py-3">
                      Mã vận đơn
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Đơn hàng
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ĐVVC
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Người nhận
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Dự kiến giao
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Giao lỗi
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Cập nhật
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr
                      key={shipment.shipment_id}
                      className="border-b border-fog/70 align-top last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{shipment.tracking_code}</p>
                        <p className="text-caption text-slate">{shipment.shipping_method_label}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${shipment.order_id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {shipment.order_code}
                        </Link>
                        <p className="text-caption text-slate">
                          {formatVND(shipment.shipping_fee)} phí ship
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate">{shipment.carrier_label}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{shipment.customer?.name ?? '—'}</p>
                        <p className="text-caption text-slate">{shipment.customer?.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={SHIPMENT_STATUS_TONES[shipment.status] ?? 'neutral'}>
                          {shipment.status_label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {formatDate(shipment.expected_delivery_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-body-s font-semibold',
                            shipment.failure_count >= MAX_DELIVERY_ATTEMPTS ? 'text-sale' : 'text-ink',
                          )}
                        >
                          {shipment.failure_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-caption text-slate">
                        {formatDateTime(shipment.updated_at ?? shipment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${shipment.order_id}`}
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

        <Pagination
          className="mt-4"
          page={pagination.page ?? 1}
          totalPages={pagination.total_pages ?? 1}
          onPageChange={(page) => patchFilters({ page })}
          disabled={query.isFetching}
        />
      </section>

      <ReturnRequestTable />
    </div>
  );
}
