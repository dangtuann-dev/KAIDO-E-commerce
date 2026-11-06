'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — TicketCreateModal
 * SRS: M10-F06 | API: API-M10-03 | BR: BR-M10-02, BR-M10-05
 * Route: /account/support, /contact
 * UI: Modal gửi yêu cầu hỗ trợ — chủ đề, tiêu đề, nội dung, đơn hàng liên quan và tệp đính kèm.
 */
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { TICKET_CATEGORY_LABELS, TICKET_SLA_HOURS } from '../display.js';
import { useCreateSupportTicket } from '../hooks/use-create-support-ticket.js';
import {
  EMPTY_TICKET_FORM,
  buildTicketFormSchema,
} from '../validation/support-form.schema.js';
import { TICKET_CATEGORIES } from '@/shared/constants/support.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const CATEGORY_OPTIONS = Object.values(TICKET_CATEGORIES).map((value) => ({
  value,
  label: TICKET_CATEGORY_LABELS[value] ?? value,
}));

function TicketFormBody({ onClose, onCreated }) {
  const toast = useToast();
  const router = useRouter();
  const createTicket = useCreateSupportTicket();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildTicketFormSchema()),
    defaultValues: { ...EMPTY_TICKET_FORM },
  });

  async function onSubmit(values) {
    try {
      const result = await createTicket.mutateAsync({
        body: {
          category: values.category,
          subject: values.subject.trim(),
          message: values.message.trim(),
          order_id: values.order_id?.trim() || undefined,
          files: values.files,
        },
      });
      toast.success(result?.message ?? 'Đã gửi yêu cầu hỗ trợ.');
      onCreated?.(result);
      onClose?.();
      if (result?.ticket_code) {
        router.push(`/account/support/${encodeURIComponent(result.ticket_code)}`);
      }
    } catch (error) {
      toast.error(error?.message ?? 'Không gửi được yêu cầu hỗ trợ.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Select
        label="Chủ đề cần hỗ trợ"
        required
        options={CATEGORY_OPTIONS}
        error={errors.category?.message}
        {...register('category')}
      />

      <Input
        label="Tiêu đề"
        required
        placeholder="Ví dụ: Đơn #KD-00021 giao thiếu 1 món"
        error={errors.subject?.message}
        {...register('subject')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ticket-message" className="text-body-s font-semibold text-ink">
          Mô tả chi tiết<span className="ml-1 text-sale" aria-hidden="true">*</span>
        </label>
        <textarea
          id="ticket-message"
          rows={4}
          placeholder="Thời gian, sản phẩm, mã đơn và mong muốn hỗ trợ của bạn…"
          className={TEXTAREA_CLASS}
          {...register('message')}
        />
        {errors.message?.message ? (
          <p className="text-body-s text-sale">{errors.message.message}</p>
        ) : null}
      </div>

      <Input
        label="Mã đơn hàng liên quan (không bắt buộc)"
        placeholder="Ví dụ: #KD-00021"
        error={errors.order_id?.message}
        hint="Đơn phải thuộc tài khoản của bạn."
        {...register('order_id')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ticket-files" className="text-body-s font-semibold text-ink">
          Ảnh / video mô tả (không bắt buộc)
        </label>
        <textarea
          id="ticket-files"
          rows={2}
          placeholder="Mỗi dòng một URL ảnh hoặc video"
          className={TEXTAREA_CLASS}
          {...register('files')}
        />
        {errors.files?.message ? (
          <p className="text-body-s text-sale">{errors.files.message}</p>
        ) : (
          <p className="text-body-s text-slate">
            KAIDO phản hồi trong {TICKET_SLA_HOURS} giờ làm việc (M10-F06).
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={createTicket.isPending}>
          Hủy
        </Button>
        <Button type="submit" loading={createTicket.isPending} loadingLabel="Đang gửi…">
          Gửi yêu cầu
        </Button>
      </div>
    </form>
  );
}

export default function TicketCreateModal({ open = false, onClose, onCreated }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Gửi yêu cầu hỗ trợ"
      description="Mô tả càng chi tiết, CSKH KAIDO càng xử lý nhanh (M10-F06)."
    >
      {open ? <TicketFormBody key="new-ticket" onClose={onClose} onCreated={onCreated} /> : null}
    </Modal>
  );
}
