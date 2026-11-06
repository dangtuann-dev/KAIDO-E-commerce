'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — TicketReplyForm
 * SRS: M10-F07 | API: API-M10-05 | BR: BR-M10-04, BR-M10-05
 * Route: /account/support/[ticketId]
 * UI: Khách phản hồi tiếp trong hội thoại ticket; yêu cầu đã RESOLVED sẽ được mở lại.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useReplySupportTicket } from '../hooks/use-reply-support-ticket.js';
import {
  EMPTY_TICKET_REPLY_FORM,
  ticketReplyFormSchema,
} from '../validation/support-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/**
 * @param {{ ticketRef: string, onReplied?: (result: object) => void }} props
 */
export default function TicketReplyForm({ ticketRef, onReplied }) {
  const toast = useToast();
  const reply = useReplySupportTicket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ticketReplyFormSchema),
    defaultValues: { ...EMPTY_TICKET_REPLY_FORM },
  });

  async function onSubmit(values) {
    try {
      const result = await reply.mutateAsync({
        ticketRef,
        body: { message: values.message.trim(), files: values.files },
      });
      toast.success(
        result?.reopened
          ? 'Đã gửi phản hồi và mở lại yêu cầu để KAIDO tiếp tục hỗ trợ.'
          : 'Đã gửi phản hồi tới KAIDO.',
      );
      reset({ ...EMPTY_TICKET_REPLY_FORM });
      onReplied?.(result);
    } catch (error) {
      toast.error(error?.message ?? 'Không gửi được phản hồi.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ticket-reply-message" className="text-body-s font-semibold text-ink">
          Phản hồi của bạn<span className="ml-1 text-sale" aria-hidden="true">*</span>
        </label>
        <textarea
          id="ticket-reply-message"
          rows={3}
          placeholder="Bổ sung thông tin hoặc xác nhận hướng xử lý của KAIDO…"
          className={TEXTAREA_CLASS}
          {...register('message')}
        />
        {errors.message?.message ? (
          <p className="text-body-s text-sale">{errors.message.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ticket-reply-files" className="text-body-s font-semibold text-ink">
          Ảnh / video bổ sung (không bắt buộc)
        </label>
        <textarea
          id="ticket-reply-files"
          rows={2}
          placeholder="Mỗi dòng một URL ảnh hoặc video"
          className={TEXTAREA_CLASS}
          {...register('files')}
        />
        {errors.files?.message ? (
          <p className="text-body-s text-sale">{errors.files.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={reply.isPending} loadingLabel="Đang gửi…">
          Gửi phản hồi
        </Button>
      </div>
    </form>
  );
}
