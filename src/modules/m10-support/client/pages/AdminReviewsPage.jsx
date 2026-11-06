'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminReviewsPage
 * SRS: M10-F04, M10-F05 | API: API-M10-07, API-M10-11, API-M10-12 | BR: BR-M10-03
 * Route: /admin/reviews
 * UI: Hàng chờ kiểm duyệt đánh giá — lọc trạng thái/số sao/từ khoá, duyệt nhanh,
 * mở hộp thoại kiểm duyệt kèm lý do và phản hồi công khai của cửa hàng.
 */
import Link from 'next/link';
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { REVIEW_STATUS_VALUES } from '@/shared/constants/support.js';
import ReviewModerationModal from '../components/ReviewModerationModal.jsx';
import StarRating from '../components/StarRating.jsx';
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONES,
  formatDateTime,
} from '../display.js';
import { useListAdminReviews } from '../hooks/use-list-admin-reviews.js';
import { useModerateReview } from '../hooks/use-moderate-review.js';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...REVIEW_STATUS_VALUES.map((value) => ({
    value,
    label: REVIEW_STATUS_LABELS[value] ?? value,
  })),
];

const RATING_FILTERS = [
  { value: '', label: 'Tất cả số sao' },
  ...[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} sao` })),
];

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', status: '', rating: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [selected, setSelected] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const moderate = useModerateReview();
  const query = useListAdminReviews({
    query: {
      page: filters.page,
      limit: PAGE_SIZE,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      rating: filters.rating || undefined,
    },
  });

  const items = query.data?.items ?? [];

  function applyFilter(patch) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  async function quickApprove(review) {
    setApprovingId(review.review_id);
    try {
      await moderate.mutateAsync({ id: review.review_id, body: { action: 'APPROVE' } });
      toast.success('Đã duyệt đánh giá và cập nhật điểm sao sản phẩm.');
    } catch (error) {
      toast.error(error?.message ?? 'Không duyệt được đánh giá.');
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Đánh giá sản phẩm</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data
              ? `${query.data.total} đánh giá · chỉ đánh giá đã duyệt mới hiển thị công khai (M10-F04).`
              : 'Đang tải danh sách đánh giá…'}
          </p>
        </div>
        <Link
          href="/admin/support"
          className="inline-flex min-h-[44px] items-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
        >
          Hàng đợi CSKH
        </Link>
      </div>

      <form
        className="mt-5 grid gap-3 rounded-md border border-fog bg-white p-4 md:grid-cols-[minmax(0,1fr)_200px_160px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ keyword: keywordDraft.trim() });
        }}
      >
        <Input
          label="Tìm theo nội dung hoặc khách hàng"
          placeholder="Ví dụ: giao nhanh, Nguyễn…"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Trạng thái"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(event) => applyFilter({ status: event.target.value })}
        />
        <Select
          label="Số sao"
          options={RATING_FILTERS}
          value={filters.rating}
          onChange={(event) => applyFilter({ rating: event.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full md:w-auto">
            Tìm
          </Button>
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-md border border-fog bg-white">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <div className="p-6 text-center">
            <p className="text-body-s text-slate">Không tải được danh sách đánh giá.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Không có đánh giá nào"
              description="Đánh giá mới của khách sẽ xuất hiện ở đây ở trạng thái chờ duyệt."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Khách hàng
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Đánh giá
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Gửi lúc
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((review) => (
                  <tr key={review.review_id} className="align-top">
                    <td className="px-4 py-3">
                      {review.product_slug ? (
                        <Link
                          href={`/products/${encodeURIComponent(review.product_slug)}`}
                          className="font-semibold text-ink hover:text-primary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {review.product_name ?? review.product_slug}
                        </Link>
                      ) : (
                        <span className="text-slate">{review.product_name ?? 'Sản phẩm đã xoá'}</span>
                      )}
                      <span className="mt-1 block font-mono text-caption text-mist">
                        {review.review_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{review.customer_name}</span>
                      {review.is_verified ? (
                        <span className="text-caption text-success-strong">Đã mua hàng</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={review.rating} size="sm" showValue />
                      {review.title ? (
                        <span className="mt-1 block font-semibold text-ink">{review.title}</span>
                      ) : null}
                      <span className="mt-1 block max-w-xs overflow-hidden text-caption text-slate [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {review.comment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <Badge tone={REVIEW_STATUS_TONES[review.status] ?? 'neutral'}>
                          {REVIEW_STATUS_LABELS[review.status] ?? review.status}
                        </Badge>
                        {review.reply ? (
                          <span className="text-caption text-success-strong">Đã phản hồi</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(review.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {review.status !== 'APPROVED' ? (
                          <Button
                            size="sm"
                            loading={approvingId === review.review_id && moderate.isPending}
                            loadingLabel="Đang duyệt…"
                            onClick={() => quickApprove(review)}
                          >
                            Duyệt
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => setSelected(review)}>
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={query.data?.page ?? filters.page}
        totalPages={query.data?.total_pages ?? 1}
        disabled={query.isFetching}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-5"
      />

      <ReviewModerationModal
        open={Boolean(selected)}
        review={selected}
        onClose={() => setSelected(null)}
        onSaved={() => query.refetch()}
      />
    </div>
  );
}
