'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — AdminUsersPage
 * SRS: M01 | API/FR: M01-F07, API-M01-07, BR-M01-05
 * Route: /admin/users
 * Render: Client Component (tương tác) — bảng tài khoản có lọc vai trò/trạng thái.
 */
import { useState } from 'react';
import AdminUserTable from '../components/AdminUserTable.jsx';
import { useListAdminUsers } from '../hooks/use-list-admin-users.js';

const DEFAULT_LIMIT = 20;

/**
 * Bỏ tham số rỗng để backend dùng giá trị mặc định.
 * @param {{ page: number, role: string, status: string, search: string, limit: number }} filters
 */
function toQuery({ page, role, status, search, limit }) {
  const query = { page, limit };
  if (role) query.role = role;
  if (status) query.status = status;
  if (search.trim()) query.search = search.trim();
  return query;
}

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({ page: 1, role: '', status: '', search: '' });

  const query = useListAdminUsers({ query: toQuery({ ...filters, limit: DEFAULT_LIMIT }) });
  const data = query.data ?? {};

  const handleFiltersChange = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Người dùng</h1>
          <p className="mt-1 text-body-s text-slate">
            Quản lý tài khoản theo vai trò và trạng thái hoạt động (M01-F07, BR-M01-05).
          </p>
        </div>
      </header>

      <div className="mt-6">
        <AdminUserTable
          users={data.users ?? []}
          total={data.total ?? 0}
          page={data.page ?? filters.page}
          limit={data.limit ?? DEFAULT_LIMIT}
          loading={query.isLoading || query.isFetching}
          error={query.isError ? (query.error?.message ?? 'Vui lòng thử lại.') : null}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onPageChange={(page) => handleFiltersChange({ page })}
        />
      </div>
    </div>
  );
}
