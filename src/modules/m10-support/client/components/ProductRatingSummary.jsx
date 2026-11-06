/**
 * [TOY-M10] Hỗ trợ và đánh giá — ProductRatingSummary
 * SRS: M10-F03 | API: API-M10-01 | BR: BR-M10-03
 * Route: /products/[slug]
 * UI: Điểm trung bình, tổng lượt đánh giá và phân bố 5→1 sao.
 */
import StarRating from './StarRating.jsx';
import { buildRatingBars } from '../display.js';

/**
 * @param {{
 *   ratingAvg?: number,
 *   ratingCount?: number,
 *   breakdown?: Record<string, number>,
 *   className?: string,
 * }} props
 */
export default function ProductRatingSummary({
  ratingAvg = 0,
  ratingCount = 0,
  breakdown = {},
  className = '',
}) {
  const average = Number(ratingAvg) || 0;
  const total = Number(ratingCount) || 0;
  const bars = buildRatingBars(breakdown, total);

  return (
    <div className={`grid gap-5 rounded-md border border-fog bg-white p-5 sm:grid-cols-[auto_1fr] ${className}`}>
      <div className="flex flex-col items-center justify-center gap-1 border-fog sm:border-r sm:pr-6">
        <p className="font-heading text-h1 text-ink">{average.toFixed(1)}</p>
        <StarRating rating={average} size="md" />
        <p className="text-caption text-slate">{total} đánh giá</p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {bars.map((bar) => (
          <li key={bar.stars} className="flex items-center gap-2 text-body-s">
            <span className="w-10 shrink-0 text-slate">{bar.stars} sao</span>
            <span
              className="h-2 flex-1 overflow-hidden rounded-full bg-fog"
              role="img"
              aria-label={`${bar.stars} sao: ${bar.count} lượt (${bar.percent}%)`}
            >
              <span
                className="block h-full rounded-full bg-accent-active"
                style={{ width: `${bar.percent}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-caption text-slate">{bar.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
