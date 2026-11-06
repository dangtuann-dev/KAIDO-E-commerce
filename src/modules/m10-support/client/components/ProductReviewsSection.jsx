'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — ProductReviewsSection
 * SRS: M10-F01, M10-F03 | API: API-M10-01, API-M10-02 | BR: BR-M10-01, BR-M10-03
 * Route: /products/[slug] (nhúng từ M02 qua public.client.js)
 * UI: Khối đánh giá trên trang chi tiết sản phẩm — điểm sao, lọc theo số sao,
 * danh sách đánh giá đã duyệt và nút gửi đánh giá Verified Purchase.
 */
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { selectAuthStatus, useAuthStore } from '@/shared/auth/auth-store.js';
import ProductRatingSummary from './ProductRatingSummary.jsx';
import ReviewCard from './ReviewCard.jsx';
import ReviewSubmissionModal from './ReviewSubmissionModal.jsx';
import { REVIEW_PAGE_SIZE } from '../display.js';
import { useListProductReviews } from '../hooks/use-list-product-reviews.js';

const STAR_FILTERS = [5, 4, 3, 2, 1];

function chipClass(active) {
  return `inline-flex min-h-[44px] items-center rounded-full border px-4 text-body-s font-semibold transition-colors duration-250 ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-fog bg-white text-ink hover:border-primary hover:text-primary'
  }`;
}

/**
 * @param {{ productRef: string, productName?: string | null }} props
 */
export default function ProductReviewsSection({ productRef, productName = null }) {
  const status = useAuthStore(selectAuthStatus);
  const [stars, setStars] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const query = useListProductReviews({
    idOrSlug: productRef,
    query: { page, limit: REVIEW_PAGE_SIZE, stars: stars || undefined },
  });

  const data = query.data ?? null;
  const reviews = data?.reviews ?? [];
  const breakdown = data?.rating_breakdown ?? {};

  function pickStars(value) {
    setStars(value);
    setPage(1);
  }

  return (
    <section aria-labelledby="product-reviews-heading" className="mt-12 border-t border-fog pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="product-reviews-heading" className="font-heading text-h3 text-ink">
            Đánh giá từ khách hàng
          </h2>
          <p className="mt-1 text-body-s text-slate">
            Chỉ khách đã mua sản phẩm trong đơn hoàn tất mới đánh giá được (BR-M10-01).
          </p>
        </div>

        {status === 'loading' ? (
          <Button loading loadingLabel="Đang kiểm tra phiên…">
            Viết đánh giá
          </Button>
        ) : status === 'authenticated' ? (
          <Button onClick={() => setFormOpen(true)}>Viết đánh giá</Button>
        ) : (
          <Link
            href={`/?auth=login&next=${encodeURIComponent(`/products/${productRef}`)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Đăng nhập để đánh giá
          </Link>
        )}
      </div>

      {query.isPending ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <Skeleton className="h-32 w-full" rounded="md" />
          <Skeleton className="h-24 w-full" rounded="md" />
        </div>
      ) : query.isError ? (
        <div className="mt-5">
          <EmptyState
            title="Không tải được đánh giá"
            description={query.error?.message ?? 'Vui lòng thử lại sau ít phút.'}
            action={
              <Button variant="outline" onClick={() => query.refetch()}>
                Thử lại
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ProductRatingSummary
            className="mt-5"
            ratingAvg={data?.rating_avg ?? 0}
            ratingCount={data?.rating_count ?? 0}
            breakdown={breakdown}
          />

          <nav aria-label="Lọc theo số sao" className="mt-4">
            <ul className="flex flex-wrap gap-2">
              <li>
                <button
                  type="button"
                  onClick={() => pickStars('')}
                  aria-pressed={!stars}
                  className={chipClass(!stars)}
                >
                  Tất cả
                </button>
              </li>
              {STAR_FILTERS.map((value) => (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => pickStars(String(value))}
                    aria-pressed={stars === String(value)}
                    className={chipClass(stars === String(value))}
                  >
                    {value} sao
                    <span className="ml-1.5 text-caption font-normal opacity-80">
                      ({Number(breakdown?.[value] ?? breakdown?.[String(value)] ?? 0)})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {reviews.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={stars ? `Chưa có đánh giá ${stars} sao` : 'Chưa có đánh giá nào'}
                description="Đánh giá được kiểm duyệt trước khi hiển thị. Hãy là người đầu tiên chia sẻ trải nghiệm."
              />
            </div>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {reviews.map((review) => (
                <li key={review.review_id}>
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={data?.page ?? page}
            totalPages={data?.total_pages ?? 1}
            disabled={query.isFetching}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}

      <ReviewSubmissionModal
        open={formOpen}
        productRef={productRef}
        productName={productName}
        onClose={() => setFormOpen(false)}
        onSaved={() => query.refetch()}
      />
    </section>
  );
}
