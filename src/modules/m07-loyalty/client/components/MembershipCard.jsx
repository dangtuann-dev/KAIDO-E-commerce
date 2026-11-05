'use client';

/**
 * [TOY-M07] MembershipCard — hạng hiện tại, tiến trình lên hạng và quyền lợi.
 * SRS: M07-F03, M07-F05, M07-F06 | API: API-M07-02 | BR: BR-M07-04
 * Route: /account/loyalty
 */
import { formatVND } from '@/shared/utils/formatVND.js';

const TIER_THRESHOLDS = Object.freeze([
  { code: 'BRONZE', label: 'Đồng', min: 0 },
  { code: 'SILVER', label: 'Bạc', min: 2000000 },
  { code: 'GOLD', label: 'Vàng', min: 5000000 },
  { code: 'DIAMOND', label: 'Kim cương', min: 15000000 },
]);

function progressOf(currentTier, spend) {
  const index = TIER_THRESHOLDS.findIndex((tier) => tier.code === currentTier);
  const current = TIER_THRESHOLDS[Math.max(index, 0)];
  const next = TIER_THRESHOLDS[index + 1];
  if (!next) return { percent: 100, remaining: 0, next: null };

  const span = next.min - current.min;
  const done = Math.min(Math.max(spend - current.min, 0), span);
  return {
    percent: span > 0 ? Math.round((done / span) * 100) : 0,
    remaining: Math.max(next.min - spend, 0),
    next,
  };
}

export default function MembershipCard({ data = null, loading = false }) {
  if (loading && !data) {
    return (
      <section className="animate-pulse rounded-md border border-fog bg-primary/5 p-6">
        <div className="h-4 w-24 rounded bg-fog" />
        <div className="mt-3 h-8 w-32 rounded bg-fog" />
        <div className="mt-6 h-2 w-full rounded-full bg-fog" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-md border border-fog p-6 text-body-s text-slate">
        Chưa có thông tin hạng thành viên. Hãy đăng nhập để xem điểm thưởng.
      </section>
    );
  }

  const tierCode = data.current_tier ?? 'BRONZE';
  const tierLabel =
    data.tier_label ?? TIER_THRESHOLDS.find((tier) => tier.code === tierCode)?.label ?? tierCode;
  const progress = progressOf(tierCode, Number(data.rolling_spend_12m ?? 0));
  const multiplier = Number(data.point_multiplier ?? 1);

  return (
    <section aria-labelledby="membership-title" className="rounded-md border border-fog bg-primary/5 p-6">
      <p className="text-caption text-slate">Hạng thành viên</p>
      <h2 id="membership-title" className="mt-1 text-2xl font-bold text-primary">
        {tierLabel}
      </h2>
      <p className="text-body-s text-slate">
        Hệ số tích điểm {Number.isInteger(multiplier) ? multiplier : multiplier.toFixed(1)}x
      </p>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-body-s">
          <span>Chi tiêu 12 tháng: {formatVND(data.rolling_spend_12m ?? 0)}</span>
          {progress.next ? (
            <span>
              Còn {formatVND(progress.remaining)} để lên {progress.next.label}
            </span>
          ) : (
            <span>Bạn đang ở hạng cao nhất</span>
          )}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-fog"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-label="Tiến trình lên hạng thành viên"
        >
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {data.benefits && Object.keys(data.benefits).length > 0 ? (
        <ul className="mt-4 space-y-1 text-body-s text-slate">
          {Object.entries(data.benefits).map(([key, value]) => (
            <li key={key}>
              {key}: {String(value)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
