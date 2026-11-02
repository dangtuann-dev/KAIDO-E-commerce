'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — FlashSaleCountdownBar
 * SRS: M09-F03, M09-F05, M09-F07 | API: API-M09-02 | BR: BR-M09-01
 * Route: /, /promotions
 * UI: Thanh đếm ngược tới giờ kết thúc chiến dịch gần nhất, tự ẩn khi hết hạn.
 * Chỉ render sau khi mount để tránh lệch thuỷ hợp (server/client khác múi giờ).
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const UNIT_LABELS = ['ngày', 'giờ', 'phút', 'giây'];

function splitRemaining(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return [
    Math.floor(totalSeconds / 86400),
    Math.floor((totalSeconds % 86400) / 3600),
    Math.floor((totalSeconds % 3600) / 60),
    totalSeconds % 60,
  ];
}

function pickCampaign(campaigns, now) {
  if (!Array.isArray(campaigns) || now == null) return null;
  const running = campaigns.filter((campaign) => {
    const endsAt = Date.parse(campaign?.ends_at ?? campaign?.end_date ?? '');
    return Number.isFinite(endsAt) && endsAt > now;
  });
  if (running.length === 0) return null;
  return running.reduce((nearest, campaign) => {
    const endsAt = Date.parse(campaign.ends_at ?? campaign.end_date);
    const nearestEndsAt = Date.parse(nearest.ends_at ?? nearest.end_date);
    return endsAt < nearestEndsAt ? campaign : nearest;
  });
}

export default function FlashSaleCountdownBar({ campaigns = [] }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const firstTick = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(timer);
    };
  }, []);

  const campaign = useMemo(() => pickCampaign(campaigns, now), [campaigns, now]);

  if (now == null || !campaign) return null;

  const endsAt = Date.parse(campaign.ends_at ?? campaign.end_date);
  const remaining = endsAt - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return null;

  const units = splitRemaining(remaining);
  const title = campaign.name ?? campaign.title ?? 'Flash sale';

  return (
    <section aria-label="Đếm ngược khuyến mãi" className="bg-ink">
      <div className="kaido-container flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
          <p className="truncate text-body-s font-semibold text-white">
            {title}
            <span className="ml-2 font-normal text-white/70">kết thúc sau</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ul className="flex items-center gap-1.5" aria-label="Thời gian còn lại">
            {units.map((value, unitIndex) => (
              <li key={UNIT_LABELS[unitIndex]} className="flex items-center gap-1.5">
                <span className="min-w-9 rounded-sm bg-white/10 px-2 py-1 text-center font-heading text-h6 text-accent tabular-nums">
                  {String(value).padStart(2, '0')}
                </span>
                <span className="text-caption text-white/70">{UNIT_LABELS[unitIndex]}</span>
                {unitIndex < units.length - 1 ? (
                  <span aria-hidden="true" className="text-white/40">
                    :
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <Link
            href="/promotions"
            className="inline-flex min-h-[36px] items-center rounded-sm border border-accent px-3 text-body-s font-semibold text-accent transition-colors duration-250 hover:bg-accent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Xem ưu đãi
          </Link>
        </div>
      </div>
    </section>
  );
}
