/**
 * [TOY-M10] Hỗ trợ và đánh giá — ReviewCard
 * SRS: M10-F03, M10-F05 | API: API-M10-01, API-M10-11
 * UI: Một đánh giá công khai — tên đã che, số sao, Verified Purchase, ảnh và
 * phản hồi của KAIDO Store.
 */
import Image from 'next/image';
import Badge from '@/shared/ui/badge.jsx';
import StarRating from './StarRating.jsx';
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_TONES, STORE_REPLY_LABEL, formatDate } from '../display.js';

/**
 * @param {{
 *   review: object,
 *   showStatus?: boolean,
 *   footer?: import('react').ReactNode,
 * }} props
 */
export default function ReviewCard({ review, showStatus = false, footer = null }) {
  if (!review) return null;
  const images = review.images ?? [];

  return (
    <article className="rounded-md border border-fog bg-white p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-body-s font-semibold text-ink">{review.customer_name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-caption text-slate">{formatDate(review.created_at)}</span>
            {review.is_verified ? <Badge tone="success">Đã mua hàng</Badge> : null}
            {showStatus ? (
              <Badge tone={REVIEW_STATUS_TONES[review.status] ?? 'neutral'}>
                {REVIEW_STATUS_LABELS[review.status] ?? review.status}
              </Badge>
            ) : null}
          </div>
        </div>
        {footer}
      </header>

      {review.title ? <h3 className="mt-3 font-heading text-h5 text-ink">{review.title}</h3> : null}
      <p className="mt-2 whitespace-pre-line text-body-s text-ink">{review.comment}</p>

      {images.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {images.map((image) => (
            <li key={image.id ?? image.url}>
              {image.media_type === 'VIDEO' ? (
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-[44px] items-center rounded-sm border border-fog px-3 text-body-s text-primary hover:border-primary"
                >
                  Xem video đính kèm
                </a>
              ) : (
                // Ảnh do khách cung cấp bằng URL; unoptimized để không cần khai báo remotePatterns.
                <Image
                  src={image.url}
                  alt={`Ảnh đánh giá của ${review.customer_name}`}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 rounded-sm border border-fog object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {review.reply ? (
        <div className="mt-4 rounded-sm border-l-2 border-primary bg-surface-sky/50 p-3">
          <p className="text-body-s font-semibold text-primary-active">{STORE_REPLY_LABEL}</p>
          <p className="mt-1 whitespace-pre-line text-body-s text-ink">{review.reply.content}</p>
          <p className="mt-1 text-caption text-slate">{formatDate(review.reply.created_at)}</p>
        </div>
      ) : null}
    </article>
  );
}
