'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminSupportPage
 * SRS: M10-F08, M10-F09, M10-F11 | API: API-M10-14, API-M10-15, API-M10-16, API-M10-17
 * Route: /admin/support
 * UI: Dashboard CSKH (chỉ số SLA, hàng đợi ticket, xử lý ticket) và tab quản lý FAQ.
 */
import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TONES,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONES,
  formatDateTime,
} from '../display.js';
import {
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
} from '@/shared/constants/support.js';
import AdminFaqManager from '../components/AdminFaqManager.jsx';
import AdminTicketDetailModal from '../components/AdminTicketDetailModal.jsx';
import { useGetSupportDashboard } from '../hooks/use-get-support-dashboard.js';
import { useListAdminSupportTickets } from '../hooks/use-list-admin-support-tickets.js';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...TICKET_STATUS_VALUES.map((value) => ({
    value,
    label: TICKET_STATUS_LABELS[value] ?? value,
  })),
];

const CATEGORY_FILTERS = [
  { value: '', label: 'Tất cả chủ đề' },
  ...TICKET_CATEGORY_VALUES.map((value) => ({
    value,
    label: TICKET_CATEGORY_LABELS[value] ?? value,
  })),
];

const PRIORITY_FILTERS = [
  { value: '', label: 'Tất cả ưu tiên' },
  ...TICKET_PRIORITY_VALUES.map((value) => ({
    value,
    label: TICKET_PRIORITY_LABELS[value] ?? value,
  })),
];

const TABS = [
  { id: 'queue', label: 'Hàng đợi ticket' },
  { id: 'faq', label: 'Câu hỏi thường gặp' },
];

function KpiCard({ label, value, hint, tone = 'text-ink' }) {
  return (
    <div className="rounded-md border border-fog bg-white p-4">
      <p className="text-caption font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className={`mt-1 font-heading text-h3 ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-caption text-slate">{hint}</p> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full" rounded="md" />
      ))}
    </div>
  );
}

function TicketQueue() {
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    category: '',
    priority: '',
    page: 1,
  });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const dashboard = useGetSupportDashboard({});
  const query = useListAdminSupportTickets({
    page: filters.page,
    limit: PAGE_SIZE,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    category: filters.category || undefined,
    priority: filters.priority || undefined,
  });

  const items = query.data?.items ?? [];
  const stats = dashboard.data ?? null;

  function applyFilter(patch) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  return (
    <div>
      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <p className="rounded-md border border-dashed border-fog bg-white p-4 text-body-s text-slate">
          Không tải được số liệu dashboard CSKH. {dashboard.error?.message ?? ''}
        </p>
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Ticket mới"
            value={stats.tickets.open}
            hint={`Tổng ${stats.tickets.total} ticket`}
          />
          <KpiCard
            label="Đang xử lý"
            value={stats.tickets.in_progress}
            hint={`Đã giải quyết: ${stats.tickets.resolved}`}
          />
          <KpiCard
            label="Quá hạn SLA"
            value={stats.tickets.overdue_sla}
            tone={stats.tickets.overdue_sla > 0 ? 'text-sale' : 'text-ink'}
            hint={`SLA ${stats.sla_response_hours} giờ làm việc`}
          />
          <KpiCard
            label="Đánh giá chờ duyệt"
            value={stats.reviews.pending}
            hint={`${stats.faqs.active} câu hỏi FAQ đang bật`}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-h4 text-ink">Hàng đợi ticket</h2>
        <Link
          href="/admin/reviews"
          className="inline-flex min-h-[44px] items-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
        >
          Kiểm duyệt đánh giá
        </Link>
      </div>

      <form
        className="mt-3 grid gap-3 rounded-md border border-fog bg-white p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ keyword: keywordDraft.trim() });
        }}
      >
        <Input
          label="Tìm theo mã ticket, tiêu đề, khách"
          placeholder="Ví dụ: #TK-00008"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Trạng thái"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(event) => applyFilter({ status: event.target.value })}
        />
        <Select
          label="Chủ đề"
          options={CATEGORY_FILTERS}
          value={filters.category}
          onChange={(event) => applyFilter({ category: event.target.value })}
        />
        <Select
          label="Ưu tiên"
          options={PRIORITY_FILTERS}
          value={filters.priority}
          onChange={(event) => applyFilter({ priority: event.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full lg:w-auto">
            Tìm
          </Button>
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-md border border-fog bg-white">
        {query.isPending ? (
          <div className="space-y-2 p-4" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-6 text-center">
            <p className="text-body-s text-slate">Không tải được hàng đợi ticket.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Không có ticket nào"
              description="Ticket mới từ khách sẽ xuất hiện ở đây để CSKH tiếp nhận theo SLA."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Ticket
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Khách hàng
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Chủ đề
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Người xử lý
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((ticket) => (
                  <tr key={ticket.ticket_id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="block font-mono text-body-s font-semibold text-primary">
                        {ticket.ticket_code}
                      </span>
                      <span className="mt-0.5 block max-w-xs truncate text-caption text-slate">
                        {ticket.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">{ticket.customer_name ?? 'Khách vãng lai'}</td>
                    <td className="px-4 py-3 text-slate">
                      {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={TICKET_STATUS_TONES[ticket.status] ?? 'neutral'}>
                          {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
                        </Badge>
                        <Badge tone={TICKET_PRIORITY_TONES[ticket.priority] ?? 'neutral'}>
                          {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{ticket.assignee_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(ticket.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(ticket.ticket_id)}>
                        Xử lý
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={query.data?.page ?? filters.page}
        totalPages={query.data?.total_pages ?? 1}
        disabled={query.isFetching}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-5"
      />

      <AdminTicketDetailModal
        open={Boolean(selectedId)}
        ticketId={selectedId}
        onClose={() => setSelectedId(null)}
        onSaved={() => query.refetch()}
      />
    </div>
  );
}

export default function AdminSupportPage() {
  const [tab, setTab] = useState('queue');

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-heading text-h2 text-ink">Chăm sóc khách hàng</h1>
        <p className="mt-1 text-body-s text-slate">
          Tiếp nhận ticket theo SLA, quản lý FAQ công khai và theo dõi hàng chờ kiểm duyệt đánh giá
          (M10-F08, M10-F09, M10-F11).
        </p>
      </div>

      <div role="tablist" aria-label="Khu vực CSKH" className="mt-5 flex gap-2 border-b border-fog">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`support-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`support-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`-mb-px min-h-[44px] border-b-2 px-4 text-body-s font-semibold transition-colors duration-250 ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`support-panel-${tab}`}
        aria-labelledby={`support-tab-${tab}`}
        className="mt-5"
      >
        {tab === 'queue' ? <TicketQueue /> : <AdminFaqManager />}
      </div>
    </div>
  );
}
