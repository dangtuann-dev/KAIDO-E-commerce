'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminBrandListPage
 * SRS: M02-F03 | API: API-M02-15..18
 * Route: /admin/brands
 * UI: Danh sách thương hiệu, logo URL, tạo/sửa/xóa mềm.
 */
import { useState } from 'react';
import Image from 'next/image';
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
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useListAdminBrands } from '../hooks/use-list-admin-brands.js';
import { useCreateBrand } from '../hooks/use-create-brand.js';
import { useUpdateBrand } from '../hooks/use-update-brand.js';
import { useDeleteBrand } from '../hooks/use-delete-brand.js';

const brandSchema = z.object({
  name: z
    .string({ required_error: 'Tên thương hiệu là bắt buộc.' })
    .trim()
    .min(2, 'Tên thương hiệu tối thiểu 2 ký tự.')
    .max(100, 'Tên thương hiệu tối đa 100 ký tự.'),
  logo_url: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^https?:\/\/\S+$/i.test(value),
      'URL logo phải bắt đầu bằng http:// hoặc https://.',
    )
    .optional(),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1.000 ký tự.').optional(),
  is_active: z.boolean().optional(),
});

function BrandForm({ initial, onSubmit, onCancel, submitting, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initial?.name ?? '',
      logo_url: initial?.logo_url ?? '',
      description: initial?.description ?? '',
      is_active: initial?.is_active ?? true,
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError ? (
        <p role="alert" className="rounded-sm border border-sale/40 bg-sale/5 px-3 py-2 text-body-s text-sale">
          {serverError}
        </p>
      ) : null}

      <Input
        label="Tên thương hiệu"
        required
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="URL logo"
        hint="Tỷ lệ 1:1 hoặc 16:9, ảnh công khai (M02-F03)."
        error={errors.logo_url?.message}
        {...register('logo_url')}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="brand-description" className="text-body-s font-semibold text-ink">
          Mô tả
        </label>
        <textarea
          id="brand-description"
          rows={3}
          className="block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...register('description')}
        />
        {errors.description?.message ? (
          <p className="text-body-s text-sale">{errors.description.message}</p>
        ) : null}
      </div>
      <Checkbox label="Đang hoạt động" {...register('is_active')} />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={submitting} loadingLabel="Đang lưu…">
          Lưu thương hiệu
        </Button>
      </div>
    </form>
  );
}

export default function AdminBrandListPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: brands = [], isPending, isError, error, refetch } = useListAdminBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverError, setServerError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const submitting = createBrand.isPending || updateBrand.isPending;

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M02-15').code] });
  }

  async function saveBrand(values) {
    setServerError('');
    const body = {
      name: values.name.trim(),
      logo_url: values.logo_url?.trim() || null,
      description: values.description?.trim() ?? '',
      is_active: Boolean(values.is_active),
    };

    try {
      if (editing === 'new') {
        await createBrand.mutateAsync({ body });
        toast.success('Đã tạo thương hiệu.');
      } else {
        await updateBrand.mutateAsync({ id: editing.id, body });
        toast.success('Đã cập nhật thương hiệu.');
      }
      setEditing(null);
      await invalidate();
    } catch (failure) {
      setServerError(failure?.message || 'Không lưu được thương hiệu.');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError('');

    try {
      await deleteBrand.mutateAsync({ id: deleting.id });
      toast.success(`Đã xóa mềm thương hiệu “${deleting.name}”.`);
      setDeleting(null);
      await invalidate();
    } catch (failure) {
      setDeleteError(failure?.message || 'Không xóa được thương hiệu.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Thương hiệu</h1>
          <p className="mt-1 text-body-s text-slate">
            Thương hiệu dùng cho bộ lọc và liên kết lọc sản phẩm (M02-F03).
          </p>
        </div>
        <Button type="button" onClick={() => setEditing('new')}>
          Thêm thương hiệu
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
              {error?.message || 'Không tải được thương hiệu.'}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có thương hiệu"
            description="Thêm thương hiệu để gắn vào sản phẩm và bộ lọc."
            action={
              <Button type="button" onClick={() => setEditing('new')}>
                Thêm thương hiệu
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-body-s">
              <caption className="sr-only">Danh sách thương hiệu</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Thương hiệu
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Slug
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
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-surface-sky/60">
                          {brand.logo_url ? (
                            <Image
                              src={brand.logo_url}
                              alt={`Logo ${brand.name}`}
                              fill
                              sizes="40px"
                              className="object-contain"
                            />
                          ) : (
                            <span aria-hidden="true" className="font-heading text-h5 text-primary">
                              {brand.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{brand.name}</p>
                          {brand.description ? (
                            <p className="line-clamp-1 text-caption text-slate">{brand.description}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{brand.slug}</td>
                    <td className="px-4 py-3">
                      <Badge tone={brand.is_active ? 'success' : 'neutral'}>
                        {brand.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setServerError('');
                            setEditing(brand);
                          }}
                          className="font-semibold text-primary"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setDeleting(brand);
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
        title={editing === 'new' ? 'Thêm thương hiệu' : 'Sửa thương hiệu'}
        description="Slug được sinh tự động từ tên thương hiệu."
      >
        {editing ? (
          <BrandForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onSubmit={saveBrand}
            onCancel={() => setEditing(null)}
            submitting={submitting}
            serverError={serverError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Xóa thương hiệu?"
        description={deleting ? `Thương hiệu “${deleting.name}” sẽ bị xóa mềm.` : undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteBrand.isPending}
              loadingLabel="Đang xóa…"
              onClick={confirmDelete}
            >
              Xóa thương hiệu
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
            Nếu thương hiệu còn sản phẩm, hệ thống sẽ từ chối xóa để bảo toàn dữ liệu.
          </p>
        )}
      </Modal>
    </div>
  );
}
