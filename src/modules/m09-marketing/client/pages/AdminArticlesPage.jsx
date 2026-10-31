'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminArticlesPage
 * SRS: M09-F02, M09-F05, M09-F06 | API: API-M09-12, API-M09-15, API-M09-24 | NFR: NFR-M09-01
 * Route: /admin/marketing/articles
 * UI: Bảng bài viết back-office — lọc trạng thái/danh mục, tìm kiếm, phân trang,
 * sửa trong modal, xem bản công khai và xóa mềm.
 */
import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import AdminArticleForm from '../components/AdminArticleForm.jsx';
import { ARTICLE_STATUS_LABELS, STATUS_TONES, formatDateTime } from '../display.js';
import { useDeleteArticle } from '../hooks/use-delete-article.js';
import { useListAdminArticles } from '../hooks/use-list-admin-articles.js';
import { ARTICLE_STATUS_VALUES } from '../validation/article-form.schema.js';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...ARTICLE_STATUS_VALUES.map((value) => ({
    value,
    label: ARTICLE_STATUS_LABELS[value] ?? value,
  })),
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

export default function AdminArticlesPage() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', status: '', category: '', page: 1 });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [editor, setEditor] = useState({ open: false, article: null });
  const [pendingDelete, setPendingDelete] = useState(null);

  const deleteArticle = useDeleteArticle();
  const query = useListAdminArticles({
    page: filters.page,
    limit: PAGE_SIZE,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    category: filters.category || undefined,
  });

  const items = query.data?.items ?? [];
  const categories = query.data?.categories ?? [];
  const totalPages = query.data?.total_pages ?? 1;

  const categoryFilters = [
    { value: '', label: 'Tất cả danh mục' },
    ...categories.map((category) => ({ value: category.slug, label: category.name })),
  ];

  function applyFilter(patch) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteArticle.mutateAsync({ id: pendingDelete.id });
      toast.success(`Đã xóa bài viết "${pendingDelete.title}".`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được bài viết.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Quản lý bài viết</h1>
          <p className="mt-1 text-body-s text-slate">
            {query.data ? `${query.data.total} bài viết` : 'Đang tải danh sách bài viết…'} · Bài
            PUBLISHED hiển thị trên /blog (M09-F02).
          </p>
        </div>
        <Button onClick={() => setEditor({ open: true, article: null })}>Tạo bài viết</Button>
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
          placeholder="Nhập tiêu đề bài viết"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Danh mục"
          options={categoryFilters}
          value={filters.category}
          onChange={(event) => applyFilter({ category: event.target.value })}
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
            <p className="text-body-s text-slate">Không tải được danh sách bài viết.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Chưa có bài viết nào"
              description="Tạo bài viết đầu tiên để chia sẻ cảm hứng chọn đồ chơi cho phụ huynh."
              action={
                <Button onClick={() => setEditor({ open: true, article: null })}>
                  Tạo bài viết
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Bài viết
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Danh mục
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Lịch xuất bản
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Lượt xem
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((article) => (
                  <tr key={article.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink">{article.title}</span>
                      <span className="block truncate text-caption text-slate">/{article.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {article.category?.name ?? 'Chưa phân loại'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[article.status] ?? 'neutral'}>
                        {ARTICLE_STATUS_LABELS[article.status] ?? article.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(article.published_at)}</td>
                    <td className="px-4 py-3 text-right text-slate">{article.view_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditor({ open: true, article })}
                        >
                          Sửa
                        </Button>
                        {article.status === 'PUBLISHED' ? (
                          <Link
                            href={`/blog/${article.slug}`}
                            target="_blank"
                            className="inline-flex min-h-[36px] items-center rounded-sm px-3 text-body-s font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Xem
                          </Link>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sale hover:bg-sale/10"
                          onClick={() => setPendingDelete(article)}
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

      <AdminArticleForm
        open={editor.open}
        article={editor.article}
        categories={categories}
        onClose={() => setEditor({ open: false, article: null })}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        size="sm"
        title="Xóa bài viết"
        description="Bài viết sẽ được xóa mềm và gỡ khỏi blog công khai ngay lập tức."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleteArticle.isPending}
              loadingLabel="Đang xóa…"
              onClick={handleDelete}
            >
              Xóa bài viết
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
