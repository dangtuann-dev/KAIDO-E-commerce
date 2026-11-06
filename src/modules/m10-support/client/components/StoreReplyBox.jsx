'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — StoreReplyBox
 * SRS: M10-F05 | API: API-M10-11
 * Route: /admin/reviews
 * UI: Cửa hàng phản hồi công khai một đánh giá; mỗi đánh giá giữ một phản hồi.
 */
import { useState } from 'react';
import Button from '@/shared/ui/button.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { STORE_REPLY_LABEL, formatDateTime } from '../display.js';
import { useReplyToReview } from '../hooks/use-reply-to-review.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/**
 * @param {{ review: { review_id: string, reply?: object | null }, onSaved?: () => void }} props
 */
export default function StoreReplyBox({ review, onSaved }) {
  const toast = useToast();
  const replyToReview = useReplyToReview();
  const existing = review?.reply ?? null;
  const [content, setContent] = useState(existing?.content ?? '');
  const [editing, setEditing] = useState(!existing);

  async function handleSubmit(event) {
    event.preventDefault();
    const value = content.trim();
    if (value.length < 5) {
      toast.error('Phản hồi tối thiểu 5 ký tự.');
      return;
    }

    try {
      await replyToReview.mutateAsync({ id: review.review_id, body: { content: value } });
      toast.success('Đã gửi phản hồi công khai.');
      setEditing(false);
      onSaved?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không gửi được phản hồi.');
    }
  }

  if (!editing) {
    return (
      <div className="mt-3 rounded-sm border-l-2 border-primary bg-surface-sky/50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-body-s font-semibold text-primary-active">{STORE_REPLY_LABEL}</p>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Sửa phản hồi
          </Button>
        </div>
        <p className="mt-1 whitespace-pre-line text-body-s text-ink">{existing?.content}</p>
        <p className="mt-1 text-caption text-slate">{formatDateTime(existing?.updated_at)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <label htmlFor={`review-reply-${review.review_id}`} className="text-body-s font-semibold text-ink">
        Phản hồi công khai của KAIDO
      </label>
      <textarea
        id={`review-reply-${review.review_id}`}
        rows={2}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Cảm ơn khách đã chia sẻ, hướng dẫn thêm nếu cần…"
        className={TEXTAREA_CLASS}
      />
      <div className="flex justify-end gap-2">
        {existing ? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              setContent(existing.content);
              setEditing(false);
            }}
          >
            Hủy
          </Button>
        ) : null}
        <Button type="submit" size="sm" loading={replyToReview.isPending} loadingLabel="Đang gửi…">
          Gửi phản hồi
        </Button>
      </div>
    </form>
  );
}
