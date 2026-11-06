/**
 * [TOY-M10] Hỗ trợ và đánh giá — TicketChatBox
 * SRS: M10-F07, M10-F08 | API: API-M10-04, API-M10-15
 * Route: /account/support/[ticketId], /admin/support
 * UI: Hội thoại ticket — tin nhắn khách, CSKH và hệ thống kèm tệp đính kèm.
 */
import { TICKET_SENDER_LABELS, formatDateTime } from '../display.js';

const BUBBLE_STYLES = {
  CUSTOMER: 'bg-surface-sky text-ink',
  STAFF: 'bg-primary text-white',
  SYSTEM: 'bg-fog text-slate',
};

/**
 * @param {{ messages?: Array<object>, emptyText?: string }} props
 */
export default function TicketChatBox({ messages = [], emptyText = 'Chưa có tin nhắn nào.' }) {
  if (messages.length === 0) {
    return <p className="text-body-s text-slate">{emptyText}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const isStaff = message.sender_type === 'STAFF';
        const isSystem = message.sender_type === 'SYSTEM';
        return (
          <li
            key={message.message_id}
            className={isStaff ? 'flex flex-col items-end' : 'flex flex-col items-start'}
          >
            <div
              className={`max-w-[85%] rounded-md px-3.5 py-2.5 ${BUBBLE_STYLES[message.sender_type] ?? BUBBLE_STYLES.SYSTEM}`}
            >
              {isSystem ? null : (
                <p className="text-caption font-semibold">
                  {TICKET_SENDER_LABELS[message.sender_type] ?? message.sender_type}
                </p>
              )}
              <p className="mt-1 whitespace-pre-line text-body-s">{message.content}</p>
              {(message.attachments ?? []).length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((file) => (
                    <li key={file.id}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-caption font-semibold ${
                          isStaff
                            ? 'border-white/40 text-white hover:border-white'
                            : 'border-fog bg-white text-primary hover:border-primary'
                        }`}
                      >
                        {file.media_type === 'VIDEO' ? 'Video đính kèm' : 'Ảnh đính kèm'}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <p className="mt-1 text-caption text-slate">{formatDateTime(message.created_at)}</p>
          </li>
        );
      })}
    </ol>
  );
}
