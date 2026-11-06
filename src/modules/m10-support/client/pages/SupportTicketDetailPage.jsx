'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — SupportTicketDetailPage
 * SRS: M10-F07 | API: API-M10-04, API-M10-05 | BR: BR-M10-04, BR-M10-05
 * Route: /account/support/[ticketId]
 * UI: Hội thoại với CSKH, trạng thái xử lý và form phản hồi của khách (NFR-M10-02).
 */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Badge from '@/shared/ui/badge.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import TicketChatBox from '../components/TicketChatBox.jsx';
import TicketReplyForm from '../components/TicketReplyForm.jsx';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TONES,
  TICKET_SLA_HOURS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONES,
  formatDateTime,
} from '../display.js';
import { useGetSupportTicket } from '../hooks/use-get-support-ticket.js';

function MetaRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wide text-slate">{label}</dt>
      <dd className="text-body-s text-ink">{children}</dd>
    </div>
  );
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const ticketRef = typeof params?.ticketId === 'string' ? decodeURIComponent(params.ticketId) : '';

  const query = useGetSupportTicket({ ticketRef }, { enabled: Boolean(ticketRef) });
  const detail = query.data ?? null;
  const ticket = detail?.ticket ?? null;
  const messages = detail?.conversation_messages ?? [];

  if (!ticketRef) {
    return (
      <EmptyState
        title="Thiếu mã yêu cầu hỗ trợ"
        description="Đường dẫn không chứa mã ticket cần xem."
        action={
          <Link href="/account/support" className="kaido-link font-semibold">
            Về danh sách yêu cầu
          </Link>
        }
      />
    );
  }

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-36 w-full" rounded="md" />
        <Skeleton className="h-64 w-full" rounded="md" />
      </div>
    );
  }

  if (query.isError || !ticket) {
    return (
      <EmptyState
        title="Không tìm thấy yêu cầu hỗ trợ"
        description={query.error?.message ?? 'Yêu cầu không tồn tại hoặc bạn không có quyền xem.'}
        action={
          <Link
            href="/account/support"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Về danh sách yêu cầu
          </Link>
        }
      />
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/support"
          className="text-body-s font-semibold text-primary hover:text-primary-hover"
        >
          ← Danh sách yêu cầu
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-body-s font-semibold text-primary">{ticket.ticket_code}</p>
            <h1 className="mt-1 font-heading text-h2 text-ink">{ticket.subject}</h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={TICKET_STATUS_TONES[ticket.status] ?? 'neutral'}>
              {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
            <Badge tone={TICKET_PRIORITY_TONES[ticket.priority] ?? 'neutral'}>
              {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </Badge>
          </div>
        </div>
      </div>

      <dl className="grid gap-4 rounded-md border border-fog bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaRow label="Chủ đề">
          {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
        </MetaRow>
        <MetaRow label="Ngày tạo">{formatDateTime(ticket.created_at)}</MetaRow>
        <MetaRow label="Cập nhật gần nhất">{formatDateTime(ticket.updated_at)}</MetaRow>
        <MetaRow label="Đơn hàng liên quan">
          {ticket.order_id ? (
            <Link
              href={`/account/orders/${encodeURIComponent(ticket.order_id)}`}
              className="font-semibold text-primary hover:text-primary-hover"
            >
              {ticket.order_id}
            </Link>
          ) : (
            'Không đính kèm'
          )}
        </MetaRow>
      </dl>

      <section aria-labelledby="ticket-conversation-heading">
        <h2 id="ticket-conversation-heading" className="font-heading text-h4 text-ink">
          Hội thoại
        </h2>
        <div className="mt-3 rounded-md border border-fog bg-white p-4">
          <TicketChatBox messages={messages} emptyText="Chưa có tin nhắn nào trong yêu cầu này." />
        </div>
      </section>

      <section aria-labelledby="ticket-reply-heading" className="rounded-md border border-fog bg-white p-4">
        <h2 id="ticket-reply-heading" className="font-heading text-h5 text-ink">
          {detail?.can_reply ? 'Phản hồi KAIDO' : 'Trạng thái yêu cầu'}
        </h2>

        {detail?.can_reply ? (
          <div className="mt-3">
            <p className="mb-3 text-body-s text-slate">
              KAIDO phản hồi trong {TICKET_SLA_HOURS} giờ làm việc. Trả lời trong cùng yêu cầu để giữ
              đầy đủ ngữ cảnh.
            </p>
            <TicketReplyForm ticketRef={ticketRef} onReplied={() => query.refetch()} />
          </div>
        ) : (
          <p className="mt-2 text-body-s text-slate">
            {isClosed
              ? 'Yêu cầu đã đóng nên không thể phản hồi tiếp. Hãy tạo yêu cầu mới nếu cần hỗ trợ thêm.'
              : 'Yêu cầu đã được giải quyết. Nếu cần tiếp tục, hãy tạo yêu cầu mới để KAIDO hỗ trợ nhanh nhất.'}
          </p>
        )}
      </section>
    </div>
  );
}
