'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — MyReviewsPage
 * SRS: M10-F02 | API: API-M10-08, API-M10-09, API-M10-10 | BR: BR-M10-03
 * Route: /account/reviews
 * UI: Danh sách đánh giá của khách kèm trạng thái kiểm duyệt; sửa hoặc xóa trong thời
 * hạn cho phép (BR-M10-03). Sửa nội dung sẽ đưa đánh giá về PENDING để duyệt lại.
 */
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewSubmissionModal from '../components/ReviewSubmissionModal.jsx';
import { MEDIA_LIMITS, REVIEW_STATUS_LABELS, REVIEW_STATUS_TONES } from '../display.js';
import { useDeleteReview } from '../hooks/use-delete-review.js';
import { useListMyReviews } from '../hooks/use-list-my-reviews.js';

const PAGE_SIZE = 10;

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-36 w-full" rounded="md" />
      ))}
    </div>
  );
}

function ProductLine({ review }) {
  const href = review.product_slug ? `/products/${review.product_slug}` : null;
  const label = review.product_name ?? 'Sản phẩm đã xóa';

  return (
    <div className="mb-3 flex items-center gap-3">
      {review.product_thumbnail_url ? (
        <Image
          src={review.product_thumbnail_url}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 rounded-sm border border-fog object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-caption uppercase tracking-wide text-slate">Sản phẩm</p>
        {href ? (
          <Link
            href={href}
            className="text-body-s font-semibold text-ink hover:text-primary"
          >
            {label}
          </Link>
        ) : (
          <p className="text-body-s font-semibold text-slate">{label}</p>
        )}
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const deleteReview = useDeleteReview();

  const query = useListMyReviews({ page, limit: PAGE_SIZE });
  const reviews = query.data?.items ?? [];

  async function confirmDelete() {
    if (!removing) return;
    try {
      await deleteReview.mutateAsync({ id: removing.review_id });
      toast.success('Đã xóa đánh giá.');
      setRemoving(null);
      if (reviews.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được đánh giá.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Đánh giá của tôi</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data
              ? `${query.data.total} đánh giá · Có thể sửa hoặc xóa trong ${MEDIA_LIMITS.editWindowDays} ngày sau khi gửi.`
              : 'Đang tải đánh giá…'}
          </p>
        </div>
        <Link
          href="/account/orders"
          className="inline-flex min-h-[44px] items-center text-body-s font-semibold text-primary hover:text-primary-hover"
        >
          Xem đơn hàng để đánh giá
        </Link>
      </div>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <EmptyState
          title="Không tải được đánh giá"
          description={query.error?.message ?? 'Vui lòng thử lại sau ít phút.'}
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Bạn chưa có đánh giá nào"
          description="Sau khi đơn hàng hoàn tất, bạn có thể đánh giá sản phẩm đã mua ở trang chi tiết sản phẩm."
          action={
            <Link href="/products">
              <Button>Khám phá sản phẩm</Button>
            </Link>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li key={review.review_id}>
                <ProductLine review={review} />
                <ReviewCard
                  review={review}
                  showStatus
                  footer={
                    review.can_edit ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(review)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoving(review)}
                        >
                          Xóa
                        </Button>
                      </div>
                    ) : (
                      <Badge tone={REVIEW_STATUS_TONES[review.status] ?? 'neutral'}>
                        Hết hạn chỉnh sửa
                      </Badge>
                    )
                  }
                />
              </li>
            ))}
          </ul>

          <Pagination
            page={query.data?.page ?? page}
            totalPages={query.data?.total_pages ?? 1}
            disabled={query.isFetching}
            onPageChange={setPage}
            className="mt-2"
          />
        </>
      )}

      <p className="text-caption text-slate">
        Đánh giá mới gửi hoặc vừa sửa đều ở trạng thái{' '}
        {REVIEW_STATUS_LABELS.PENDING ?? 'Chờ duyệt'} cho đến khi CSKH kiểm duyệt (BR-M10-03).
      </p>

      <ReviewSubmissionModal
        open={Boolean(editing)}
        review={editing}
        productRef={editing?.product_slug}
        productName={editing?.product_name}
        onClose={() => setEditing(null)}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        size="sm"
        title="Xóa đánh giá?"
        description="Đánh giá sẽ bị xóa vĩnh viễn và điểm sao của sản phẩm được tính lại."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setRemoving(null)} disabled={deleteReview.isPending}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteReview.isPending}
              loadingLabel="Đang xóa…"
            >
              Xóa đánh giá
            </Button>
          </div>
        }
      >
        {removing ? (
          <p className="text-body-s text-ink">
            Bạn chắc chắn muốn xóa đánh giá {removing.rating} sao cho{' '}
            <strong>{removing.product_name ?? 'sản phẩm này'}</strong>?
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
