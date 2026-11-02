'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderTrackingTimeline
 * SRS: M05-F10, M06-F03 | API: API-M05-03 | BR: BR-M06-01
 * Route: /order-success/[code], /account/orders/[orderRef]
 * UI: Timeline trạng thái theo enum thống nhất 13 giá trị kèm thời điểm và ghi chú.
 */
import { cn } from '@/shared/utils/cn.js';
import { formatDateTime } from '../utils/datetime.js';

const SOURCE_LABELS = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên KAIDO',
  SYSTEM: 'Hệ thống',
  CARRIER: 'Đơn vị vận chuyển',
};

/**
 * @param {{
 *   history?: Array<{
 *     history_id: string,
 *     to_status: string,
 *     to_status_label?: string,
 *     change_source?: string,
 *     changed_by_role?: string | null,
 *     note?: string | null,
 *     created_at: string,
 *   }>,
 *   className?: string,
 * }} props
 */
export default function OrderTrackingTimeline({ history = [], className }) {
  if (history.length === 0) {
    return (
      <section className={cn('rounded-md border border-fog bg-white p-5', className)}>
        <h2 className="font-heading text-h5 text-ink">Lịch sử đơn hàng</h2>
        <p className="mt-2 text-body-s text-slate">Chưa có cập nhật trạng thái nào cho đơn này.</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="order-timeline-title"
      className={cn('rounded-md border border-fog bg-white p-5', className)}
    >
      <h2 id="order-timeline-title" className="font-heading text-h5 text-ink">
        Lịch sử đơn hàng
      </h2>

      <ol className="mt-4 space-y-0">
        {history.map((entry, index) => {
          const isCurrent = index === history.length - 1;
          const source = SOURCE_LABELS[entry.change_source] ?? entry.change_source ?? '—';

          return (
            <li key={entry.history_id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isCurrent ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-4 h-full w-px bg-fog"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2',
                  isCurrent ? 'border-primary bg-primary' : 'border-fog bg-white',
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-body-s',
                    isCurrent ? 'font-semibold text-ink' : 'font-medium text-ink',
                  )}
                >
                  {entry.to_status_label ?? entry.to_status}
                  {isCurrent ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-caption font-semibold text-primary">
                      Hiện tại
                    </span>
                  ) : null}
                </p>
                <p className="text-caption text-slate">
                  {formatDateTime(entry.created_at)} · {source}
                </p>
                {entry.note ? <p className="mt-1 text-caption text-slate">{entry.note}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
