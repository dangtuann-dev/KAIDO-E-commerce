'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — SupportTicketsPage
 * SRS: M10-F06, M10-F07 | API: API-M10-03, API-M10-13 | BR: BR-M10-04, BR-M10-05
 * Route: /account/support
 * UI: Danh sách yêu cầu hỗ trợ của khách, lọc trạng thái, phân trang và mở form tạo ticket.
 */
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { TICKET_STATUS_VALUES } from '@/shared/constants/support.js';
import CustomerTicketList from '../components/CustomerTicketList.jsx';
import TicketCreateModal from '../components/TicketCreateModal.jsx';
import {
  TICKET_AUTO_CLOSE_HOURS,
  TICKET_SLA_HOURS,
  TICKET_STATUS_LABELS,
} from '../display.js';
import { useListMySupportTickets } from '../hooks/use-list-my-support-tickets.js';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...TICKET_STATUS_VALUES.map((value) => ({
    value,
    label: TICKET_STATUS_LABELS[value] ?? value,
  })),
];

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full" rounded="md" />
      ))}
    </div>
  );
}

export default function SupportTicketsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const query = useListMySupportTickets({
    query: {
      page,
      limit: PAGE_SIZE,
      status: status || undefined,
    },
  });

  const tickets = query.data?.items ?? [];

  function openCreate() {
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Yêu cầu hỗ trợ</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data
              ? `${query.data.total} yêu cầu · KAIDO phản hồi trong ${TICKET_SLA_HOURS} giờ làm việc.`
              : 'Đang tải danh sách yêu cầu…'}
          </p>
        </div>
        <Button onClick={openCreate}>Gửi yêu cầu mới</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4">
        <div className="w-full max-w-xs">
          <Select
            label="Trạng thái"
            options={STATUS_FILTERS}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Link
          href="/faq"
          className="inline-flex min-h-[44px] items-center text-body-s font-semibold text-primary hover:text-primary-hover"
        >
          Xem câu hỏi thường gặp
        </Link>
      </div>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Không tải được yêu cầu hỗ trợ"
          description={query.error?.message ?? 'Vui lòng thử lại sau ít phút.'}
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : (
        <>
          <CustomerTicketList
            tickets={tickets}
            emptyAction={
              status ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus('');
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc trạng thái
                </Button>
              ) : (
                <Button onClick={openCreate}>Gửi yêu cầu hỗ trợ</Button>
              )
            }
          />

          <Pagination
            page={query.data?.page ?? page}
            totalPages={query.data?.total_pages ?? 1}
            disabled={query.isFetching}
            onPageChange={setPage}
            className="mt-2"
          />
        </>
      )}

      <p className="text-caption text-slate">
        Yêu cầu đã giải quyết sẽ tự đóng sau {TICKET_AUTO_CLOSE_HOURS} giờ nếu không có phản hồi mới
        (BR-M10-04). Bạn vẫn có thể mở lại bằng cách phản hồi trước khi yêu cầu đóng.
      </p>

      <TicketCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => query.refetch()}
      />
    </div>
  );
}
