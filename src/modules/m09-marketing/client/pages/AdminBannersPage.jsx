'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminBannersPage
 * SRS: M09-F01, M09-F05, M09-F06 | API: API-M09-09, API-M09-10, API-M09-11 | BR: BR-M09-04
 * Route: /admin/marketing/banners
 * UI: Bảng banner back-office — lọc vị trí/trạng thái, tìm kiếm, phân trang, bật/tắt và xóa mềm.
 */
import { useState } from 'react';
import Image from 'next/image';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import AdminBannerForm from '../components/AdminBannerForm.jsx';
import {
  BANNER_POSITION_LABELS,
  CONTENT_STATUS_LABELS,
  STATUS_TONES,
  formatDateTime,
} from '../display.js';
import { useDeleteBanner } from '../hooks/use-delete-banner.js';
import { useListAdminBanners } from '../hooks/use-list-admin-banners.js';

const PAGE_SIZE = 20;

const POSITION_FILTERS = [
  { value: '', label: 'Tất cả vị trí' },
  ...Object.entries(BANNER_POSITION_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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

export default function AdminBannersPage() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', position: '', status: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [editor, setEditor] = useState({ open: false, banner: null });
  const [pendingDelete, setPendingDelete] = useState(null);

  const deleteBanner = useDeleteBanner();
  const query = useListAdminBanners({
    page: filters.page,
    limit: PAGE_SIZE,
    keyword: filters.keyword || undefined,
    position: filters.position || undefined,
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
      await deleteBanner.mutateAsync({ id: pendingDelete.id });
      toast.success(`Đã xóa banner "${pendingDelete.title}".`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được banner.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Quản lý banner</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data ? `${query.data.total} banner` : 'Đang tải danh sách banner…'} · Tối đa 5
            banner hero đang bật (BR-M09-04).
          </p>
        </div>
        <Button onClick={() => setEditor({ open: true, banner: null })}>Thêm banner</Button>
      </div>

      <form
        className="mt-5 grid gap-3 rounded-md border border-fog bg-white p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilter({ keyword: keywordDraft.trim() });
        }}
      >
        <Input
          label="Tìm theo tiêu đề"
          placeholder="Nhập tiêu đề banner"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Vị trí"
          options={POSITION_FILTERS}
          value={filters.position}
          onChange={(event) => applyFilter({ position: event.target.value })}
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
            <p className="text-body-s text-slate">Không tải được danh sách banner.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Chưa có banner nào"
              description="Thêm banner để bắt đầu hiển thị nội dung quảng bá trên trang chủ."
              action={<Button onClick={() => setEditor({ open: true, banner: null })}>Thêm banner</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Banner
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vị trí
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Thứ tự
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Lịch hiển thị
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
                {items.map((banner) => (
                  <tr key={banner.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative block h-12 w-20 shrink-0 overflow-hidden rounded-sm bg-surface-sky">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{banner.title}</span>
                          {banner.target_url ? (
                            <span className="block truncate text-caption text-slate">
                              → {banner.target_url}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {BANNER_POSITION_LABELS[banner.position] ?? banner.position}
                    </td>
                    <td className="px-4 py-3 text-slate">{banner.display_order}</td>
                    <td className="px-4 py-3 text-slate">
                      <span className="block">{formatDateTime(banner.start_time)}</span>
                      <span className="block text-caption">
                        đến {formatDateTime(banner.end_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={STATUS_TONES[banner.status] ?? 'neutral'}>
                          {CONTENT_STATUS_LABELS[banner.status] ?? banner.status}
                        </Badge>
                        <Badge tone={banner.is_active ? 'success' : 'neutral'}>
                          {banner.is_active ? 'Đang bật' : 'Đang tắt'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditor({ open: true, banner })}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sale hover:bg-sale/10"
                          onClick={() => setPendingDelete(banner)}
                        >
                          Xóa
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

      <AdminBannerForm
        open={editor.open}
        banner={editor.banner}
        onClose={() => setEditor({ open: false, banner: null })}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Xóa banner"
        description="Banner sẽ được xóa mềm và ngừng hiển thị ngay trên cửa hàng."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleteBanner.isPending}
              loadingLabel="Đang xóa…"
              onClick={handleDelete}
            >
              Xóa banner
            </Button>
          </>
        }
      >
        <p className="text-body-s text-ink">
          Bạn có chắc muốn xóa <strong>{pendingDelete?.title}</strong>?
        </p>
      </Modal>
    </div>
  );
}
