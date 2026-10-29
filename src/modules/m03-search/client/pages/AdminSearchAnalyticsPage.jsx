'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — AdminSearchAnalyticsPage
 * SRS: M03-F12 | API: API-M03-04
 * Route: /admin/analytics/search
 * UI: Bộ lọc khoảng ngày, tổng lượt tìm, top từ khóa và từ khóa không có kết quả.
 */
import { useState } from 'react';
import { selectAuthStatus, selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ROLES } from '@/shared/constants/roles.js';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import SearchKeywordStats from '../components/SearchKeywordStats.jsx';
import { useGetSearchStatistics } from '../hooks/use-get-search-statistics.js';

const CAN_VIEW_ROLES = [ROLES.ADMIN, ROLES.MARKETING];

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-md border border-fog bg-white px-4 py-3">
      <p className="text-caption uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-heading text-h3 text-ink">{value}</p>
      {hint ? <p className="text-caption text-slate">{hint}</p> : null}
    </div>
  );
}

export default function AdminSearchAnalyticsPage() {
  const user = useAuthStore(selectAuthUser);
  const status = useAuthStore(selectAuthStatus);
  const canView = CAN_VIEW_ROLES.includes(user?.role);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '' });

  const statsQuery = useGetSearchStatistics(
    {
      query: {
        date_from: applied.from || undefined,
        date_to: applied.to || undefined,
      },
    },
    { enabled: canView, staleTime: 60_000 },
  );

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          title="Không có quyền truy cập"
          description="Chỉ ADMIN và MARKETING được xem thống kê tìm kiếm (SRS §2.2)."
        />
      </div>
    );
  }

  function handleApply(event) {
    event.preventDefault();
    if (dateFrom && dateTo && dateTo < dateFrom) {
      setRangeError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }
    setRangeError('');
    setApplied({ from: dateFrom, to: dateTo });
  }

  function handleReset() {
    setDateFrom('');
    setDateTo('');
    setRangeError('');
    setApplied({ from: '', to: '' });
  }

  const stats = statsQuery.data;
  const topKeywords = stats?.top_keywords ?? [];
  const zeroResultKeywords = stats?.zero_result_keywords ?? [];
  const zeroResultTotal = zeroResultKeywords.reduce((total, row) => total + row.count, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-heading text-h2 text-ink">Thống kê tìm kiếm</h1>
        <p className="mt-1 text-body-s text-slate">
          Theo dõi từ khóa khách hàng quan tâm và các từ khóa chưa trả về kết quả.
        </p>
      </div>

      <form
        onSubmit={handleApply}
        className="mt-5 flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4"
        aria-label="Lọc thống kê theo khoảng ngày"
      >
        <Input
          label="Từ ngày"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(event) => setDateFrom(event.target.value)}
          containerClassName="w-full sm:w-44"
        />
        <Input
          label="Đến ngày"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => setDateTo(event.target.value)}
          containerClassName="w-full sm:w-44"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" loading={statsQuery.isFetching}>
            Áp dụng
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleReset}>
            Tất cả thời gian
          </Button>
        </div>
        {rangeError ? (
          <p role="alert" className="w-full text-body-s text-sale">
            {rangeError}
          </p>
        ) : null}
      </form>

      {statsQuery.isError ? (
        <div className="mt-5 rounded-md border border-fog bg-white p-6 text-center">
          <p role="alert" className="text-body-s text-sale">
            {statsQuery.error?.message || 'Không tải được thống kê tìm kiếm.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => statsQuery.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : statsQuery.isPending ? (
        <div className="mt-5 space-y-3" aria-busy="true">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[90px] w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Tổng lượt tìm kiếm"
              value={formatNumber(stats?.total_searches)}
              hint={
                applied.from || applied.to
                  ? `${applied.from || '…'} → ${applied.to || '…'}`
                  : 'Toàn bộ thời gian'
              }
            />
            <StatCard
              label="Từ khóa hàng đầu"
              value={topKeywords[0]?.keyword ?? '—'}
              hint={
                topKeywords[0]
                  ? `${formatNumber(topKeywords[0].count)} lượt tìm`
                  : 'Chưa có dữ liệu'
              }
            />
            <StatCard
              label="Lượt tìm không có kết quả"
              value={formatNumber(zeroResultTotal)}
              hint={`${formatNumber(zeroResultKeywords.length)} từ khóa khác nhau`}
            />
          </div>

          <SearchKeywordStats
            title="Top từ khóa"
            description="Xếp theo số lượt tìm trong khoảng ngày đã chọn."
            rows={topKeywords}
            emptyTitle="Chưa có lượt tìm kiếm nào trong khoảng ngày này"
          />

          <SearchKeywordStats
            title="Từ khóa không có kết quả"
            description="Gợi ý bổ sung sản phẩm/nội dung cho các từ khóa khách tìm nhưng chưa thấy."
            rows={zeroResultKeywords}
            emptyTitle="Không có từ khóa nào không trả về kết quả"
            showSearchLink
          />
        </>
      )}
    </div>
  );
}
