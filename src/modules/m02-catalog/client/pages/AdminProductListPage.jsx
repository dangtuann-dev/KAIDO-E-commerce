'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductListPage
 * SRS: M02-F05, M02-F06, M02-F13 | API: API-M02-08, API-M02-06
 * Route: /admin/products
 * UI: Bảng sản phẩm, lọc trạng thái/từ khóa, phân trang, xóa mềm có xác nhận.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { PRODUCT_STATUS_LABELS } from '@/shared/constants/product.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import ProductStockBadge from '../components/ProductStockBadge.jsx';
import { useListAdminProducts } from '../hooks/use-list-admin-products.js';
import { useDeleteProduct } from '../hooks/use-delete-product.js';

const STATUS_TONES = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  INACTIVE: 'warning',
  DISCONTINUED: 'danger',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value));
  } catch {
    return '—';
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function AdminProductListPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteProduct();
  const [filters, setFilters] = useState({ keyword: '', status: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const variables = {
    query: {
      page: filters.page,
      limit: PAGE_SIZE,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
    },
  };

  const { data, isPending, isError, error, refetch, isFetching } = useListAdminProducts(variables);
  const items = data?.items ?? [];
  const hasFilters = Boolean(filters.keyword || filters.status);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError('');

    try {
      await deleteMutation.mutateAsync({ id: deleting.id });
      toast.success(`Đã xóa mềm “${deleting.name}”.`);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M02-08').code] });
    } catch (deleteFailure) {
      setDeleteError(deleteFailure?.message || 'Không xóa được sản phẩm.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Quản lý sản phẩm</h1>
          <p className="mt-1 text-body-s text-slate">
            {data ? `${data.total} sản phẩm` : 'Đang tải danh sách sản phẩm…'}
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
        >
          Thêm sản phẩm
        </Link>
      </div>

      <form
        className="mt-5 flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters((current) => ({ ...current, keyword: keywordDraft.trim(), page: 1 }));
        }}
      >
        <Input
          label="Tìm theo tên sản phẩm"
          type="search"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          placeholder="Ví dụ: Lego"
          containerClassName="min-w-[220px] flex-1"
        />
        <Select
          label="Trạng thái"
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
          }
          options={STATUS_OPTIONS}
          containerClassName="min-w-[180px]"
        />
        <Button type="submit" size="sm">
          Lọc
        </Button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setKeywordDraft('');
              setFilters({ keyword: '', status: '', page: 1 });
            }}
            className="min-h-[44px] px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
          >
            Xóa lọc
          </button>
        ) : null}
      </form>

      <div className="mt-5 rounded-md border border-fog bg-white">
        {isPending ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {error?.message || 'Không tải được danh sách sản phẩm.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có sản phẩm phù hợp"
            description={
              hasFilters
                ? 'Không có sản phẩm khớp bộ lọc. Hãy thử điều kiện khác.'
                : 'Tạo sản phẩm đầu tiên để bắt đầu bán hàng.'
            }
            action={
              <Link
                href="/admin/products/create"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
              >
                Thêm sản phẩm
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-body-s">
              <caption className="sr-only">Danh sách sản phẩm quản trị</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Sản phẩm
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Danh mục
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Giá
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tồn kho
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60' : undefined}>
                {items.map((product) => (
                  <tr key={product.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface-sky/50">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt={product.thumbnail_alt || product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{product.name}</p>
                          <p className="text-caption text-slate">
                            {product.default_sku || 'Chưa có SKU'} · {product.variants_count} biến thể
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{product.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={product.price_sale ? 'font-semibold text-sale' : 'text-ink'}>
                        {formatVND(product.price)}
                      </span>
                      {product.price_sale ? (
                        <s className="ml-2 text-caption text-mist">
                          {formatVND(product.price_regular)}
                        </s>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <ProductStockBadge stock={product.stock} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[product.status] ?? 'neutral'}>
                        {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDate(product.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-semibold text-primary"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeleting(product);
                          }}
                          className="font-semibold text-sale"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data ? (
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          disabled={isFetching}
          onPageChange={(nextPage) =>
            setFilters((current) => ({ ...current, page: nextPage }))
          }
          className="mt-6"
        />
      ) : null}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa sản phẩm?"
        description={
          deleting
            ? `“${deleting.name}” sẽ được ẩn khỏi cửa hàng (xóa mềm) và có thể khôi phục bởi quản trị viên.`
            : undefined
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              loadingLabel="Đang xóa…"
              onClick={confirmDelete}
            >
              Xóa sản phẩm
            </Button>
          </>
        }
      >
        {deleteError ? (
          <p role="alert" className="text-body-s text-sale">
            {deleteError}
          </p>
        ) : (
          <p className="text-body-s text-slate">
            Sản phẩm đã có đơn hàng vẫn giữ nguyên dữ liệu lịch sử; chỉ ngừng hiển thị trên
            storefront.
          </p>
        )}
      </Modal>
    </div>
  );
}
