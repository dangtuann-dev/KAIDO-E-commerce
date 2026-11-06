/**
 * [TOY-M10] Hỗ trợ và đánh giá — CustomerTicketList
 * SRS: M10-F07 | API: API-M10-13
 * Route: /account/support
 * UI: Danh sách yêu cầu hỗ trợ của khách — mã, chủ đề, ưu tiên, trạng thái, mốc thời gian.
 */
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TONES,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONES,
  formatDateTime,
} from '../display.js';

/**
 * @param {{ tickets?: Array<object>, emptyAction?: import('react').ReactNode }} props
 */
export default function CustomerTicketList({ tickets = [], emptyAction = null }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa có yêu cầu hỗ trợ nào"
        description="Gửi yêu cầu khi cần hỗ trợ đơn hàng, bảo hành hoặc tư vấn sản phẩm — KAIDO phản hồi trong 24 giờ làm việc."
        action={emptyAction}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tickets.map((ticket) => (
        <li key={ticket.ticket_id}>
          <Link
            href={`/account/support/${encodeURIComponent(ticket.ticket_code ?? ticket.ticket_id)}`}
            className="block rounded-md border border-fog bg-white p-4 transition-colors duration-250 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-body-s font-semibold text-primary">
                  {ticket.ticket_code}
                </p>
                <p className="mt-0.5 text-body text-ink">{ticket.subject}</p>
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
            <p className="mt-2 text-caption text-slate">
              {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category} · Cập nhật{' '}
              {formatDateTime(ticket.updated_at)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
