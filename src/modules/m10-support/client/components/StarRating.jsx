/**
 * [TOY-M10] Hỗ trợ và đánh giá — StarRating
 * SRS: M10-F03 | API: API-M10-01
 * UI: Hiển thị số sao đã chấm; luôn kèm nhãn cho trình đọc màn hình.
 */
import { cn } from '@/shared/utils/cn.js';

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' };

function Star({ filled, className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85Z" />
    </svg>
  );
}

/**
 * @param {{ rating?: number, size?: 'sm'|'md'|'lg', showValue?: boolean, className?: string }} props
 */
export default function StarRating({ rating = 0, size = 'md', showValue = false, className }) {
  const value = Math.round(Number(rating) || 0);
  const starClass = SIZES[size] ?? SIZES.md;

  return (
    <span className={cn('inline-flex items-center gap-1 text-accent-active', className)}>
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} trên 5 sao`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} filled={star <= value} className={starClass} />
        ))}
      </span>
      {showValue ? (
        <span className="text-body-s font-semibold text-ink">{Number(rating || 0).toFixed(1)}</span>
      ) : null}
    </span>
  );
}
