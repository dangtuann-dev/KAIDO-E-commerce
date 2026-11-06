'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — AdminUserTable
 * SRS: M01-F07 | API: API-M01-07 | BR: BR-M01-05
 * Route: /admin/users
 * UI: Bảng người dùng có lọc vai trò, trạng thái, từ khóa và phân trang.
 */
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { ROLE_LABELS, ROLE_VALUES } from '@/shared/constants/roles.js';

const STATUS_LABELS = Object.freeze({
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Tạm khóa',
  DISABLED: 'Đã khóa',
});

const STATUS_TONES = Object.freeze({
  ACTIVE: 'success',
  LOCKED: 'warning',
  DISABLED: 'danger',
});

const ROLE_TONES = Object.freeze({
  ADMIN: 'primary',
  STAFF: 'info',
  WAREHOUSE_KEEPER: 'neutral',
  MARKETING: 'info',
  CUSTOMER: 'neutral',
});

const ROLE_OPTIONS = ROLE_VALUES.map((value) => ({
  value,
  label: ROLE_LABELS[value] ?? value,
}));

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMATTER.format(date);
}

/**
 * @param {{
 *   users?: object[],
 *   total?: number,
 *   page?: number,
 *   limit?: number,
 *   loading?: boolean,
 *   error?: string | null,
 *   filters: { role?: string, status?: string, search?: string },
 *   onFiltersChange?: (patch: object) => void,
 *   onPageChange?: (page: number) => void,
 * }} props
 */
export default function AdminUserTable({
  users = [],
  total = 0,
  page = 1,
  limit = 20,
  loading = false,
  error = null,
  filters,
  onFiltersChange,
  onPageChange,
}) {
  const hasFilters = Boolean(filters.role || filters.status || filters.search);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-fog bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_180px_auto] md:items-end">
          <Input
            id="admin-user-search"
            label="Tìm kiếm"
            placeholder="Họ tên, email hoặc SĐT"
            value={filters.search ?? ''}
            onChange={(event) => onFiltersChange?.({ search: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Select
            id="admin-user-role"
            label="Vai trò"
            placeholder="Tất cả vai trò"
            options={ROLE_OPTIONS}
            value={filters.role ?? ''}
            onChange={(event) => onFiltersChange?.({ role: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Select
            id="admin-user-status"
            label="Trạng thái"
            placeholder="Tất cả trạng thái"
            options={STATUS_OPTIONS}
            value={filters.status ?? ''}
            onChange={(event) => onFiltersChange?.({ status: event.target.value, page: 1 })}
            disabled={loading}
          />
          <Button
            variant="outline"
            onClick={() => onFiltersChange?.({ role: '', status: '', search: '', page: 1 })}
            disabled={loading || !hasFilters}
          >
            Xóa lọc
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-5">
          <p className="text-body-s font-semibold text-sale">Không tải được danh sách người dùng</p>
          <p className="mt-1 text-body-s text-slate">{error}</p>
        </div>
      ) : loading && users.length === 0 ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-14 w-full" rounded="sm" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Chưa có tài khoản nào"
          description={
            hasFilters
              ? 'Không tài khoản nào khớp bộ lọc hiện tại. Thử xóa lọc để xem toàn bộ.'
              : 'Tài khoản đăng ký mới sẽ xuất hiện tại đây.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-fog bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left text-body-s">
              <caption className="sr-only">Danh sách tài khoản</caption>
              <thead>
                <tr className="border-b border-fog bg-surface-sky/40 text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Tài khoản
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Số điện thoại
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vai trò
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Đăng nhập gần nhất
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-fog/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{user.full_name}</p>
                      <p className="text-caption text-slate">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">{user.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ROLE_TONES[user.role] ?? 'neutral'}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[user.status] ?? 'neutral'}>
                        {STATUS_LABELS[user.status] ?? user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(user.last_login_at)}</td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-slate">Tổng {total} tài khoản</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} disabled={loading} />
          </div>
        </>
      )}
    </div>
  );
}
