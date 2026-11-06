'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminFaqManager
 * SRS: M10-F09 | API: API-M10-18, API-M10-19, API-M10-20, API-M10-21, API-M10-22, API-M10-23
 * Route: /admin/support (tab FAQ)
 * UI: Biên tập câu hỏi thường gặp — lọc theo nhóm/từ khoá, thêm/sửa, ẩn hoặc bật lại.
 */
import { useState } from 'react';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import FaqCategoryFormModal from './FaqCategoryFormModal.jsx';
import FaqFormModal from './FaqFormModal.jsx';
import { formatDateTime } from '../display.js';
import { useDeleteFaq } from '../hooks/use-delete-faq.js';
import { useListAdminFaqs } from '../hooks/use-list-admin-faqs.js';
import { useUpdateFaq } from '../hooks/use-update-faq.js';

export default function AdminFaqManager() {
  const toast = useToast();
  const [filters, setFilters] = useState({ keyword: '', categoryId: '' });
  const [keywordDraft, setKeywordDraft] = useState('');
  const [editor, setEditor] = useState({ open: false, faq: null });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pendingHide, setPendingHide] = useState(null);

  const deleteFaq = useDeleteFaq();
  const updateFaq = useUpdateFaq();
  const query = useListAdminFaqs({
    keyword: filters.keyword || undefined,
    category_id: filters.categoryId || undefined,
    include_inactive: 'true',
  });

  const items = query.data?.items ?? [];
  const categories = query.data?.categories ?? [];

  const categoryOptions = [
    { value: '', label: 'Tất cả nhóm' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  async function handleHide() {
    if (!pendingHide) return;
    try {
      await deleteFaq.mutateAsync({ id: pendingHide.id });
      toast.success('Đã ẩn câu hỏi khỏi trang FAQ công khai.');
      setPendingHide(null);
    } catch (error) {
      toast.error(error?.message ?? 'Không ẩn được câu hỏi.');
    }
  }

  async function handleRestore(faq) {
    try {
      await updateFaq.mutateAsync({ id: faq.id, body: { is_active: true } });
      toast.success('Đã bật lại câu hỏi.');
    } catch (error) {
      toast.error(error?.message ?? 'Không bật lại được câu hỏi.');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-h4 text-ink">Câu hỏi thường gặp</h2>
          <p className="mt-1 text-body-s text-slate">
            {query.data
              ? `${query.data.total} câu hỏi · ${categories.length} nhóm đang quản lý.`
              : 'Đang tải danh sách câu hỏi…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCategoryOpen(true)}>
            Thêm nhóm
          </Button>
          <Button
            onClick={() => setEditor({ open: true, faq: null })}
            disabled={categories.length === 0}
          >
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      <form
        className="mt-4 grid gap-3 rounded-md border border-fog bg-white p-4 md:grid-cols-[minmax(0,1fr)_240px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters((current) => ({ ...current, keyword: keywordDraft.trim() }));
        }}
      >
        <Input
          label="Tìm câu hỏi"
          placeholder="Ví dụ: đổi trả, phí ship…"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
        />
        <Select
          label="Nhóm"
          options={categoryOptions}
          value={filters.categoryId}
          onChange={(event) =>
            setFilters((current) => ({ ...current, categoryId: event.target.value }))
          }
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full md:w-auto">
            Tìm
          </Button>
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-md border border-fog bg-white">
        {query.isPending ? (
          <div className="space-y-2 p-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-6 text-center">
            <p className="text-body-s text-slate">Không tải được danh sách câu hỏi.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Chưa có câu hỏi nào"
              description={
                categories.length === 0
                  ? 'Tạo nhóm câu hỏi trước, sau đó thêm các câu hỏi thường gặp cho nhóm đó.'
                  : 'Thêm câu hỏi để khách tự tra cứu thay vì phải gửi ticket.'
              }
              action={
                categories.length === 0 ? (
                  <Button onClick={() => setCategoryOpen(true)}>Thêm nhóm câu hỏi</Button>
                ) : (
                  <Button onClick={() => setEditor({ open: true, faq: null })}>Thêm câu hỏi</Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-body-s">
              <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Câu hỏi
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Nhóm
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Thứ tự
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Hiển thị
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {items.map((faq) => (
                  <tr key={faq.id} className="align-top">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink">{faq.question}</span>
                      <span className="mt-1 block max-w-md overflow-hidden text-caption text-slate [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {faq.answer}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">{faq.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate">{faq.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge tone={faq.is_active ? 'success' : 'neutral'}>
                        {faq.is_active ? 'Công khai' : 'Đang ẩn'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(faq.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditor({ open: true, faq })}
                        >
                          Sửa
                        </Button>
                        {faq.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sale hover:bg-sale/10"
                            onClick={() => setPendingHide(faq)}
                          >
                            Ẩn
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={updateFaq.isPending}
                            onClick={() => handleRestore(faq)}
                          >
                            Bật lại
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FaqFormModal
        open={editor.open}
        faq={editor.faq}
        categories={categories}
        onClose={() => setEditor({ open: false, faq: null })}
        onSaved={() => query.refetch()}
      />

      <FaqCategoryFormModal
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onSaved={() => query.refetch()}
      />

      <Modal
        open={Boolean(pendingHide)}
        onClose={() => setPendingHide(null)}
        size="sm"
        title="Ẩn câu hỏi"
        description="Câu hỏi bị xóa mềm và không còn hiển thị trên trang /faq; có thể bật lại sau."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingHide(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleteFaq.isPending}
              loadingLabel="Đang ẩn…"
              onClick={handleHide}
            >
              Ẩn câu hỏi
            </Button>
          </>
        }
      >
        <p className="text-body-s text-ink">
          Bạn có chắc muốn ẩn <strong>{pendingHide?.question}</strong>?
        </p>
      </Modal>
    </div>
  );
}
