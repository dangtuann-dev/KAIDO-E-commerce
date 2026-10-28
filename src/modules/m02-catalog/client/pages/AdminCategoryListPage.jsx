'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminCategoryListPage
 * SRS: M02-F01, M02-F02 | API: API-M02-11..14 | BR: BR-M02-02
 * Route: /admin/categories
 * UI: Cây danh mục 2–3 cấp, tạo/sửa/xóa mềm; chặn xóa khi còn danh mục con hoặc sản phẩm.
 */
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useListAdminCategories } from '../hooks/use-list-admin-categories.js';
import { useCreateCategory } from '../hooks/use-create-category.js';
import { useUpdateCategory } from '../hooks/use-update-category.js';
import { useDeleteCategory } from '../hooks/use-delete-category.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const categorySchema = z.object({
  name: z
    .string({ required_error: 'Tên danh mục là bắt buộc.' })
    .trim()
    .min(2, 'Tên danh mục tối thiểu 2 ký tự.')
    .max(120, 'Tên danh mục tối đa 120 ký tự.'),
  parent_id: z
    .string()
    .trim()
    .refine((value) => !value || UUID_PATTERN.test(value), 'Danh mục cha không hợp lệ.')
    .optional(),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1.000 ký tự.').optional(),
  sort_order: z
    .number()
    .int('Thứ tự phải là số nguyên.')
    .min(0, 'Thứ tự không được âm.')
    .max(9999, 'Thứ tự tối đa 9999.')
    .optional(),
  is_active: z.boolean().optional(),
});

function flatten(nodes, depth = 0, list = []) {
  for (const node of nodes ?? []) {
    list.push({ ...node, depth });
    flatten(node.children, depth + 1, list);
  }
  return list;
}

function CategoryForm({ initial, categories, onSubmit, onCancel, submitting, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? '',
      parent_id: initial?.parent_id ?? '',
      description: initial?.description ?? '',
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active ?? true,
    },
  });

  const parentOptions = flatten(categories)
    .filter((category) => category.id !== initial?.id)
    .map((category) => ({
      value: category.id,
      label: `${'— '.repeat(category.depth)}${category.name}`,
    }));

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError ? (
        <p role="alert" className="rounded-sm border border-sale/40 bg-sale/5 px-3 py-2 text-body-s text-sale">
          {serverError}
        </p>
      ) : null}

      <Input label="Tên danh mục" required error={errors.name?.message} {...register('name')} />
      <Select
        label="Danh mục cha"
        placeholder="— Danh mục gốc —"
        options={parentOptions}
        error={errors.parent_id?.message}
        {...register('parent_id')}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-description" className="text-body-s font-semibold text-ink">
          Mô tả
        </label>
        <textarea
          id="category-description"
          rows={3}
          className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...register('description')}
        />
        {errors.description?.message ? (
          <p className="text-body-s text-sale">{errors.description.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Thứ tự hiển thị"
          type="number"
          inputMode="numeric"
          min="0"
          max="9999"
          error={errors.sort_order?.message}
          {...register('sort_order', {
            setValueAs: (value) => (value === '' ? undefined : Number(value)),
          })}
        />
        <Checkbox
          label="Đang hoạt động (hiển thị trên storefront)"
          containerClassName="self-end"
          {...register('is_active')}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={submitting} loadingLabel="Đang lưu…">
          Lưu danh mục
        </Button>
      </div>
    </form>
  );
}

export default function AdminCategoryListPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [], isPending, isError, error, refetch } = useListAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverError, setServerError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const rows = useMemo(() => flatten(categories), [categories]);
  const submitting = createCategory.isPending || updateCategory.isPending;

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M02-11').code] });
  }

  async function saveCategory(values) {
    setServerError('');
    const body = {
      name: values.name.trim(),
      parent_id: values.parent_id || null,
      description: values.description?.trim() ?? '',
      sort_order: values.sort_order,
      is_active: Boolean(values.is_active),
    };

    try {
      if (editing === 'new') {
        const payload = { ...body };
        if (!payload.parent_id) delete payload.parent_id;
        await createCategory.mutateAsync({ body: payload });
        toast.success('Đã tạo danh mục.');
      } else {
        await updateCategory.mutateAsync({ id: editing.id, body });
        toast.success('Đã cập nhật danh mục.');
      }
      setEditing(null);
      await invalidate();
    } catch (failure) {
      setServerError(failure?.message || 'Không lưu được danh mục.');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError('');

    try {
      await deleteCategory.mutateAsync({ id: deleting.id });
      toast.success(`Đã xóa mềm danh mục “${deleting.name}”.`);
      setDeleting(null);
      await invalidate();
    } catch (failure) {
      setDeleteError(failure?.message || 'Không xóa được danh mục.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Danh mục sản phẩm</h1>
          <p className="mt-1 text-body-s text-slate">
            Cây tối đa 3 cấp; không thể xóa danh mục còn danh mục con hoặc sản phẩm (BR-M02-02).
          </p>
        </div>
        <Button type="button" onClick={() => setEditing('new')}>
          Thêm danh mục
        </Button>
      </div>

      <div className="mt-5 rounded-md border border-fog bg-white">
        {isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {error?.message || 'Không tải được danh mục.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có danh mục"
            description="Tạo danh mục gốc trước, sau đó thêm danh mục con nếu cần."
            action={
              <Button type="button" onClick={() => setEditing('new')}>
                Thêm danh mục
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-body-s">
              <caption className="sr-only">Cây danh mục sản phẩm</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tên danh mục
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Slug
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Thứ tự
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr key={category.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3">
                      <span style={{ paddingLeft: `${category.depth * 20}px` }}>
                        {category.depth > 0 ? (
                          <span aria-hidden="true" className="mr-1 text-mist">
                            └
                          </span>
                        ) : null}
                        <span className="font-semibold text-ink">{category.name}</span>
                        {category.children?.length ? (
                          <span className="ml-2 text-caption text-slate">
                            ({category.children.length} danh mục con)
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate">{category.slug}</td>
                    <td className="px-4 py-3 text-slate">{category.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge tone={category.is_active ? 'success' : 'neutral'}>
                        {category.is_active ? 'Đang hoạt động' : 'Đang ẩn'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setServerError('');
                            setEditing(category);
                          }}
                          className="font-semibold text-primary"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeleting(category);
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

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Thêm danh mục' : 'Sửa danh mục'}
        description="Slug được sinh tự động từ tên danh mục."
        size="md"
      >
        {editing ? (
          <CategoryForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            categories={categories}
            onSubmit={saveCategory}
            onCancel={() => setEditing(null)}
            submitting={submitting}
            serverError={serverError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa danh mục?"
        description={deleting ? `Danh mục “${deleting.name}” sẽ bị xóa mềm.` : undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteCategory.isPending}
              loadingLabel="Đang xóa…"
              onClick={confirmDelete}
            >
              Xóa danh mục
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
            Nếu danh mục còn danh mục con hoặc sản phẩm đang hoạt động, hệ thống sẽ từ chối xóa.
          </p>
        )}
      </Modal>
    </div>
  );
}
