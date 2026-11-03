'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — CarrierTrackingCard
 * SRS: M06-F03, M06-F10, M06-F11 | API: API-M06-03 | BR: BR-M06-03
 * Route: /account/orders/[orderRef]
 * UI: Thông tin ĐVVC, mã vận đơn, lịch sử cập nhật; cảnh báo sau 3 lần giao thất bại.
 */
import { cn } from '@/shared/utils/cn.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { SHIPMENT_STATUS } from '@/shared/constants/shipping.js';
import { useGetOrderTracking } from '../hooks/use-get-order-tracking.js';
import { SHIPMENT_STATUS_TONES } from '../constants.js';
import { formatDateTime } from '../utils/datetime.js';

const FAILURE_STATUSES = [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNING, SHIPMENT_STATUS.RETURNED];

/**
 * @param {{ orderRef: string, className?: string }} props
 */
export default function CarrierTrackingCard({ orderRef, className }) {
  const trackingQuery = useGetOrderTracking({ orderRef }, { enabled: Boolean(orderRef) });
  const tracking = trackingQuery.data ?? null;

  return (
    <section
      aria-labelledby="carrier-tracking-card-title"
      className={cn('rounded-md border border-fog bg-white p-5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="carrier-tracking-card-title" className="font-heading text-h5 text-ink">
          Đơn vị vận chuyển
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => trackingQuery.refetch()}
          loading={trackingQuery.isFetching}
        >
          Làm mới
        </Button>
      </div>

      {trackingQuery.isLoading ? (
        <div className="mt-3 space-y-2" aria-hidden="true">
          <Skeleton className="h-5 w-1/2" rounded="sm" />
          <Skeleton className="h-20 w-full" rounded="sm" />
        </div>
      ) : trackingQuery.isError ? (
        <p className="mt-3 text-body-s text-slate">
          {trackingQuery.error?.message ?? 'Không tải được thông tin vận chuyển.'}
        </p>
      ) : !tracking?.tracking_code ? (
        <p className="mt-3 text-body-s text-slate">
          {tracking?.message ?? 'Chưa có vận đơn cho đơn hàng này.'}
        </p>
      ) : (
        <>
          <dl className="mt-3 space-y-2 text-body-s">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate">Hãng vận chuyển</dt>
              <dd className="font-semibold text-ink">{tracking.carrier_label}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate">Mã vận đơn</dt>
              <dd className="font-heading text-h6 text-primary">{tracking.tracking_code}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate">Hình thức</dt>
              <dd className="text-ink">{tracking.shipping_method_label}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate">Trạng thái</dt>
              <dd>
                <Badge tone={SHIPMENT_STATUS_TONES[tracking.current_status] ?? 'neutral'}>
                  {tracking.current_status_label ?? '—'}
                </Badge>
              </dd>
            </div>
          </dl>

          {tracking.failure_count > 0 ? (
            <p
              className={cn(
                'mt-3 rounded-sm px-3 py-2 text-body-s',
                FAILURE_STATUSES.includes(tracking.current_status)
                  ? 'bg-sale/5 text-sale'
                  : 'bg-accent/20 text-ink',
              )}
            >
              Đã ghi nhận {tracking.failure_count}/{tracking.max_delivery_attempts} lần giao thất bại.
              {tracking.failure_count >= tracking.max_delivery_attempts
                ? ' Đơn sẽ được chuyển hoàn theo BR-M06-03.'
                : ''}
            </p>
          ) : null}

          <h3 className="mt-5 text-body-s font-semibold text-ink">Lịch sử cập nhật</h3>
          {tracking.timeline?.length ? (
            <ol className="mt-3 space-y-0">
              {tracking.timeline.map((event, index) => {
                const isLast = index === tracking.timeline.length - 1;
                return (
                  <li key={event.event_id ?? `${event.status}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {!isLast ? (
                      <span aria-hidden="true" className="absolute left-[5px] top-3 h-full w-px bg-fog" />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                        isLast ? 'bg-primary' : 'bg-mist',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-body-s', isLast ? 'font-semibold text-ink' : 'text-ink')}>
                        {event.status_label}
                        {event.source === 'SIMULATION' ? (
                          <span className="ml-2 text-caption font-normal text-slate">(dự kiến)</span>
                        ) : null}
                      </p>
                      {event.description ? (
                        <p className="text-caption text-slate">{event.description}</p>
                      ) : null}
                      <p className="text-caption text-mist">
                        {formatDateTime(event.occurred_at)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-body-s text-slate">
              Chưa có cập nhật từ đơn vị vận chuyển. Vui lòng quay lại sau.
            </p>
          )}
        </>
      )}
    </section>
  );
}
