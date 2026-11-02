'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCouponsPage
 * SRS: M09-F04, M09-F06 | API: API-M09-21, API-M09-22, API-M09-23 | BR: BR-M09-01
 * Route: /admin/marketing/coupons
 * UI: Bảng mã giảm giá back-office — lọc trạng thái, tìm theo mã, phân trang,
 * sửa điều kiện/hiệu lực trong modal và ngừng áp dụng (xóa mềm).
 */
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';
import AdminCouponForm from '../components/AdminCouponForm.jsx';
import {
  COUPON_SCOPE_LABELS,
  COUPON_STATUS_LABELS,
  DISCOUNT_TYPE_LABELS,
  STATUS_TONES,
  formatDate,
} from '../display.js';
import { useDeleteCoupon } from '../hooks/use-delete-coupon.js';
import { useListAdminCoupons } from '../hooks/use-list-admin-coupons.js';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(COUPON_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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

function discountSummary(coupon) {
  if (coupon.discount_type === 'PERCENT') {
    const cap = coupon.max_discount_amount
      ? ` (tối đa ${formatVND(coupon.max_discount_amount)})`
      : '';
    return `${coupon.discount_value}%${cap}`;
  }
  if (coupon.discount_type === 'FIXED') return formatVND(coupon.discount_value);
  return 'Miễn phí vận chuyển';
}

function usageSummary(coupon) {
  const used = coupon.actual_usage_count ?? coupon.used_count ?? 0;
  const limit = coupon.usage_limit;
  return limit == null ? `${used} / ∞` : `${used} / ${limit}`;
}

export default function AdminCouponsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', status: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [editor, setEditor] = useState({ open: false, coupon: null });
  const [pendingDelete, setPendingDelete] = useState(null);

  const deleteCoupon = useDeleteCoupon();
  const query = useListAdminCoupons({
    page: filters.page,
    limit: PAGE_SIZE,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
  });

  const items = query.data?.items ?? [];
  const totalPages = query.data?.total_pages ?? 1;

  function applyFilter(patch) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteCoupon.mutateAsync({ id: pendingDelete.coupon_id ?? pendingDelete.id });
      toast.success(`Đã ngừng áp dụng mã ${pendingDelete.code}.`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(error?.message ?? 'Không ngừng được mã giảm giá.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Mã giảm giá</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data ? `${query.data.total} mã` : 'Đang tải danh sách mã…'} · Coupon dùng chung
            cho giỏ hàng, thanh toán và hạng thành viên (M09-F08).
          </p>
        </div>
        <Button onClick={() => setEditor({ open: true, coupon: null })}>Tạo mã giảm giá</Button>
      </div>

      <form
        className="mt-5 grid gap-3 rounded-md border border-fog bg-white p-4 md:grid-cols-[minmax(0,1fr)_200px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ keyword: keywordDraft.trim() });
        }}
      >
        <Input
          label="Tìm theo mã hoặc tên"
          placeholder="Ví dụ: TOY2026"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Trạng thái"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(event) => applyFilter({ status: event.target.value })}
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
            <p className="text-body-s text-slate">Không tải được danh sách mã giảm giá.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Chưa có mã giảm giá nào"
              description="Tạo mã để chạy ưu đãi trên trang khuyến mãi và ở bước thanh toán."
              action={
                <Button onClick={() => setEditor({ open: true, coupon: null })}>
                  Tạo mã giảm giá
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Mã
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Giảm giá
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Điều kiện
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Hiệu lực
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Lượt dùng
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((coupon) => (
                  <tr key={coupon.coupon_id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="block font-mono text-body-s font-semibold text-ink">
                        {coupon.code}
                      </span>
                      <span className="block truncate text-caption text-slate">{coupon.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <span className="block text-ink">{discountSummary(coupon)}</span>
                      <span className="block text-caption">
                        {DISCOUNT_TYPE_LABELS[coupon.discount_type] ?? coupon.discount_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <span className="block">
                        Đơn từ {formatVND(coupon.min_order_amount ?? 0)}
                      </span>
                      <span className="block text-caption">
                        {COUPON_SCOPE_LABELS[coupon.scope] ?? coupon.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <span className="block">{formatDate(coupon.valid_from)}</span>
                      <span className="block text-caption">đến {formatDate(coupon.valid_to)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate">{usageSummary(coupon)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={STATUS_TONES[coupon.status] ?? 'neutral'}>
                          {COUPON_STATUS_LABELS[coupon.status] ?? coupon.status}
                        </Badge>
                        <Badge tone={coupon.is_active ? 'success' : 'neutral'}>
                          {coupon.is_active ? 'Đang bật' : 'Đang tắt'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditor({ open: true, coupon })}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sale hover:bg-sale/10"
                          disabled={coupon.status === 'EXPIRED'}
                          onClick={() => setPendingDelete(coupon)}
                        >
                          Ngừng
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
        totalPages={totalPages}
        disabled={query.isFetching}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        className="mt-5"
      />

      <AdminCouponForm
        open={editor.open}
        coupon={editor.coupon}
        onClose={() => setEditor({ open: false, coupon: null })}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Ngừng áp dụng mã"
        description="Mã bị xóa mềm và không áp dụng cho đơn mới; đơn đã đặt vẫn giữ ưu đãi."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleteCoupon.isPending}
              loadingLabel="Đang ngừng…"
              onClick={handleDelete}
            >
              Ngừng áp dụng
            </Button>
          </>
        }
      >
        <p className="text-body-s text-ink">
          Bạn có chắc muốn ngừng mã <strong>{pendingDelete?.code}</strong>?
        </p>
      </Modal>
    </div>
  );
}
