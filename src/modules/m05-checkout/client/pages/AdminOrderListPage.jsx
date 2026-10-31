'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderListPage
 * SRS: M05 | API/FR: M05-F11, M06-F05, API-M05-06
 * Route: /admin/orders
 * Render: Client Component. Lọc theo trạng thái/từ khóa/khoảng ngày + phân trang server-side.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Pagination from '@/shared/ui/pagination.jsx';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value.js';
import AdminOrderTable from '../components/AdminOrderTable.jsx';
import { useListAdminOrders } from '../hooks/use-list-admin-orders.js';

const DEFAULT_LIMIT = 20;

const INITIAL_FILTERS = Object.freeze({
  page: 1,
  status: '',
  search: '',
  from_date: '',
  to_date: '',
});

export default function AdminOrderListPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 450);

  // Chip lọc trạng thái phản hồi ngay, còn truy vấn chờ người dùng ngừng gõ.
  const query = useMemo(() => {
    const variables = { page: filters.page, limit: DEFAULT_LIMIT };
    if (filters.status) variables.status = filters.status;
    if (debouncedSearch.trim()) variables.search = debouncedSearch.trim();
    if (filters.from_date) variables.from_date = filters.from_date;
    if (filters.to_date) variables.to_date = filters.to_date;
    return variables;
  }, [filters.page, filters.status, filters.from_date, filters.to_date, debouncedSearch]);

  const ordersQuery = useListAdminOrders(query);

  const data = ordersQuery.data ?? null;
  const pagination = data?.pagination ?? { page: 1, total_pages: 1, total: 0 };

  function handleFiltersChange(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Đơn hàng</h1>
          <p className="mt-1 text-body-s text-slate">
            {data?.total_orders ?? 0} đơn trong hệ thống. Cập nhật trạng thái theo đúng luồng 13 bước
            (BR-M06-01).
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-body-s font-semibold text-primary hover:underline"
        >
          Về bảng điều khiển
        </Link>
      </header>

      <div className="mt-6">
        <AdminOrderTable
          orders={data?.items ?? []}
          loading={ordersQuery.isLoading || ordersQuery.isFetching}
          error={ordersQuery.isError ? ordersQuery.error?.message ?? 'Không tải được danh sách đơn.' : null}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          statusCounts={data?.status_counts ?? {}}
          totalOrders={pagination.total ?? 0}
          onRefresh={() => ordersQuery.refetch()}
        />
      </div>

      <Pagination
        className="mt-6"
        page={pagination.page ?? 1}
        totalPages={pagination.total_pages ?? 1}
        onPageChange={(page) => handleFiltersChange({ page })}
        disabled={ordersQuery.isFetching}
      />
    </div>
  );
}
