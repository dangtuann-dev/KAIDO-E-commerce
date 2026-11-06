'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqCategoryFormModal
 * SRS: M10-F09 | API: API-M10-23
 * Route: /admin/support (tab FAQ)
 * UI: Tạo nhóm câu hỏi thường gặp; slug bỏ trống thì server tự sinh từ tên.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useCreateFaqCategory } from '../hooks/use-create-faq-category.js';
import {
  EMPTY_FAQ_CATEGORY_FORM,
  faqCategoryFormSchema,
} from '../validation/support-form.schema.js';

function CategoryFormBody({ onClose, onSaved }) {
  const toast = useToast();
  const createCategory = useCreateFaqCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(faqCategoryFormSchema),
    defaultValues: { ...EMPTY_FAQ_CATEGORY_FORM },
  });

  async function onSubmit(values) {
    try {
      await createCategory.mutateAsync({
        body: {
          name: values.name.trim(),
          slug: values.slug?.trim() || undefined,
          sort_order: Number(values.sort_order ?? 0),
        },
      });
      toast.success('Đã tạo nhóm câu hỏi.');
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không tạo được nhóm câu hỏi.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Tên nhóm"
        required
        placeholder="Ví dụ: Giao hàng & vận chuyển"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Slug (không bắt buộc)"
        placeholder="giao-hang"
        hint="Bỏ trống để hệ thống tự sinh từ tên nhóm."
        error={errors.slug?.message}
        {...register('slug')}
      />

      <Input
        label="Thứ tự hiển thị"
        type="number"
        min={0}
        max={9999}
        error={errors.sort_order?.message}
        {...register('sort_order')}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={createCategory.isPending}>
          Hủy
        </Button>
        <Button type="submit" loading={createCategory.isPending} loadingLabel="Đang tạo…">
          Tạo nhóm
        </Button>
      </div>
    </form>
  );
}

/**
 * @param {{ open?: boolean, onClose?: () => void, onSaved?: () => void }} props
 */
export default function FaqCategoryFormModal({ open = false, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Thêm nhóm câu hỏi"
      description="Nhóm giúp khách tra cứu FAQ theo chủ đề (M10-F10)."
    >
      {open ? <CategoryFormBody key="new-faq-category" onClose={onClose} onSaved={onSaved} /> : null}
    </Modal>
  );
}
