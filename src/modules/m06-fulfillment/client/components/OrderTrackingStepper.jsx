'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — OrderTrackingStepper
 * SRS: M06-F01, M06-F03 | API: API-M06-03 | BR: BR-M06-01
 * Route: /account/orders/[orderRef]
 * UI: Stepper 5 bước PENDING → DELIVERED, cảnh báo giao thất bại/hoàn hàng.
 */
import { cn } from '@/shared/utils/cn.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { SHIPMENT_STATUS } from '@/shared/constants/shipping.js';
import { useGetOrderTracking } from '../hooks/use-get-order-tracking.js';
import { formatDate } from '../utils/datetime.js';

const FAILURE_STATUSES = [SHIPMENT_STATUS.FAILED, SHIPMENT_STATUS.RETURNING, SHIPMENT_STATUS.RETURNED];

function StepDot({ reached, current }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-caption font-bold transition-colors duration-250',
        reached ? 'border-primary bg-primary text-white' : 'border-fog bg-white text-mist',
        current && 'ring-4 ring-primary/15',
      )}
    >
      {reached ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="m5 13 4 4 10-10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="h-2 w-2 rounded-full bg-current" />
      )}
    </span>
  );
}

/**
 * @param {{ orderRef: string, className?: string }} props
 */
export default function OrderTrackingStepper({ orderRef, className }) {
  const trackingQuery = useGetOrderTracking({ orderRef }, { enabled: Boolean(orderRef) });
  const tracking = trackingQuery.data ?? null;

  return (
    <section
      aria-labelledby="order-tracking-stepper-title"
      className={cn('rounded-md border border-fog bg-white p-5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="order-tracking-stepper-title" className="font-heading text-h5 text-ink">
          Hành trình đơn hàng
        </h2>
        {tracking?.order_status_label ? (
          <Badge tone="info">{tracking.order_status_label}</Badge>
        ) : null}
      </div>

      {trackingQuery.isLoading ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          <Skeleton className="h-8 w-full" rounded="sm" />
          <Skeleton className="h-8 w-2/3" rounded="sm" />
        </div>
      ) : trackingQuery.isError ? (
        <div className="mt-3 rounded-sm border border-sale/30 bg-sale/5 px-3 py-3 text-body-s">
          <p className="font-semibold text-sale">Không tải được hành trình vận chuyển</p>
          <p className="mt-0.5 text-slate">
            {trackingQuery.error?.message ?? 'Vui lòng thử lại sau ít phút.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => trackingQuery.refetch()}
            loading={trackingQuery.isFetching}
          >
            Thử lại
          </Button>
        </div>
      ) : !tracking || !tracking.tracking_code ? (
        <p className="mt-3 text-body-s text-slate">
          {tracking?.message ?? 'Đơn hàng chưa được bàn giao cho đơn vị vận chuyển.'}
        </p>
      ) : (
        <>
          <p className="mt-2 text-body-s text-slate">
            Dự kiến giao:{' '}
            <span className="font-semibold text-ink">{formatDate(tracking.expected_delivery_date)}</span>
          </p>

          {tracking.steps?.length ? (
            <ol className="mt-5 grid gap-3 sm:grid-cols-5 sm:gap-1">
              {tracking.steps.map((step, index) => (
                <li key={step.status} className="relative flex items-center gap-3 sm:block">
                  {index < tracking.steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-4 top-8 h-6 w-px sm:left-1/2 sm:top-4 sm:h-px sm:w-full',
                        step.reached ? 'bg-primary/40' : 'bg-fog',
                      )}
                    />
                  ) : null}
                  <div className="relative z-10 flex items-center gap-3 sm:flex-col sm:items-center">
                    <StepDot reached={step.reached} current={step.current} />
                    <p
                      className={cn(
                        'text-body-s sm:mt-2 sm:text-center sm:text-caption',
                        step.current
                          ? 'font-semibold text-primary'
                          : step.reached
                            ? 'font-medium text-ink'
                            : 'text-mist',
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {FAILURE_STATUSES.includes(tracking.current_status) ? (
            <div className="mt-4 rounded-sm border border-sale/30 bg-sale/5 px-3 py-2 text-body-s text-sale">
              {tracking.current_status === SHIPMENT_STATUS.RETURNED
                ? 'Đơn đã được chuyển hoàn về KAIDO. Bộ phận CSKH sẽ liên hệ để hỗ trợ.'
                : `Đơn đang gặp sự cố giao hàng (${tracking.current_status_label}). ${
                    tracking.failure_count >= tracking.max_delivery_attempts
                      ? `Đã giao thất bại ${tracking.failure_count} lần — đã đạt giới hạn ${tracking.max_delivery_attempts} lần.`
                      : 'Đơn vị vận chuyển sẽ thử giao lại.'
                  }`}
            </div>
          ) : null}

          {tracking.delivered_at ? (
            <p className="mt-3 text-body-s text-success-strong">
              Đã giao lúc {formatDate(tracking.delivered_at)}.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
