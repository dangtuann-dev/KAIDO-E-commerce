'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqFormModal
 * SRS: M10-F09 | API: API-M10-19, API-M10-20
 * Route: /admin/support (tab FAQ)
 * UI: Tạo/sửa câu hỏi thường gặp — nhóm, câu hỏi, câu trả lời, thứ tự và trạng thái hiển thị.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useCreateFaq } from '../hooks/use-create-faq.js';
import { useUpdateFaq } from '../hooks/use-update-faq.js';
import { EMPTY_FAQ_FORM, faqFormSchema } from '../validation/support-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function FaqFormBody({ faq, categories, onClose, onSaved }) {
  const toast = useToast();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const editing = Boolean(faq?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(faqFormSchema),
    defaultValues: editing
      ? {
          category_id: faq.category_id ?? categories[0]?.id ?? '',
          question: faq.question ?? '',
          answer: faq.answer ?? '',
          sort_order: faq.sort_order ?? 0,
          is_active: faq.is_active !== false,
        }
      : { ...EMPTY_FAQ_FORM, category_id: categories[0]?.id ?? '' },
  });

  const pending = createFaq.isPending || updateFaq.isPending;

  async function onSubmit(values) {
    const body = {
      category_id: values.category_id,
      question: values.question.trim(),
      answer: values.answer.trim(),
      sort_order: Number(values.sort_order ?? 0),
      is_active: Boolean(values.is_active),
    };

    try {
      if (editing) {
        await updateFaq.mutateAsync({ id: faq.id, body });
        toast.success('Đã cập nhật câu hỏi.');
      } else {
        await createFaq.mutateAsync({ body });
        toast.success('Đã thêm câu hỏi thường gặp.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không lưu được câu hỏi.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Select
        label="Nhóm câu hỏi"
        required
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        error={errors.category_id?.message}
        {...register('category_id')}
      />

      <Input
        label="Câu hỏi"
        required
        placeholder="Ví dụ: KAIDO giao hàng trong bao lâu?"
        error={errors.question?.message}
        {...register('question')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="faq-answer" className="text-body-s font-semibold text-ink">
          Câu trả lời<span className="ml-1 text-sale" aria-hidden="true">*</span>
        </label>
        <textarea
          id="faq-answer"
          rows={5}
          placeholder="Trả lời ngắn gọn, nêu rõ chính sách và mốc thời gian…"
          className={TEXTAREA_CLASS}
          {...register('answer')}
        />
        {errors.answer?.message ? (
          <p className="text-body-s text-sale">{errors.answer.message}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Thứ tự hiển thị"
          type="number"
          min={0}
          max={9999}
          error={errors.sort_order?.message}
          {...register('sort_order')}
        />
        <div className="flex items-end">
          <Checkbox label="Hiển thị công khai" {...register('is_active')} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={pending}>
          Hủy
        </Button>
        <Button type="submit" loading={pending} loadingLabel="Đang lưu…">
          {editing ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
        </Button>
      </div>
    </form>
  );
}

/**
 * @param {{
 *   open?: boolean,
 *   faq?: object | null,
 *   categories?: Array<{ id: string, name: string }>,
 *   onClose?: () => void,
 *   onSaved?: () => void,
 * }} props
 */
export default function FaqFormModal({
  open = false,
  faq = null,
  categories = [],
  onClose,
  onSaved,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={faq?.id ? 'Sửa câu hỏi thường gặp' : 'Thêm câu hỏi thường gặp'}
      description="Câu hỏi đang hiển thị sẽ cập nhật ngay trên trang /faq (M10-F09)."
    >
      {open ? (
        <FaqFormBody
          key={faq?.id ?? 'new-faq'}
          faq={faq}
          categories={categories}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
