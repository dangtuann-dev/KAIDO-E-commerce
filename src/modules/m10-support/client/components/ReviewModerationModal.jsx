'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — ReviewModerationModal
 * SRS: M10-F04, M10-F05 | API: API-M10-07, API-M10-11 | BR: BR-M10-03
 * Route: /admin/reviews
 * UI: Xem trước đánh giá, chọn hành động kiểm duyệt kèm lý do và phản hồi công khai.
 */
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import ReviewCard from './ReviewCard.jsx';
import StoreReplyBox from './StoreReplyBox.jsx';
import { MODERATION_ACTION_LABELS } from '../display.js';
import { useModerateReview } from '../hooks/use-moderate-review.js';
import {
  EMPTY_MODERATION_FORM,
  moderationFormSchema,
} from '../validation/support-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const ACTION_OPTIONS = Object.entries(MODERATION_ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function ModerationBody({ review, onClose, onSaved }) {
  const toast = useToast();
  const moderate = useModerateReview();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(moderationFormSchema),
    defaultValues: { ...EMPTY_MODERATION_FORM },
  });

  const action = useWatch({ control, name: 'action' });
  const reasonRequired = action !== 'APPROVE';

  async function onSubmit(values) {
    try {
      await moderate.mutateAsync({
        id: review.review_id,
        body: {
          action: values.action,
          reason: values.reason?.trim() || undefined,
        },
      });
      toast.success(`Đã ${MODERATION_ACTION_LABELS[values.action]?.toLowerCase() ?? 'cập nhật'} đánh giá.`);
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không cập nhật được trạng thái đánh giá.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReviewCard review={review} showStatus />

      <StoreReplyBox review={review} onSaved={onSaved} />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <Select
          label="Hành động kiểm duyệt"
          required
          options={ACTION_OPTIONS}
          error={errors.action?.message}
          {...register('action')}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="moderation-reason" className="text-body-s font-semibold text-ink">
            Lý do{reasonRequired ? <span className="ml-1 text-sale" aria-hidden="true">*</span> : null}
          </label>
          <textarea
            id="moderation-reason"
            rows={2}
            placeholder="Ghi chú nội bộ, hiển thị cho khách trong lịch sử đánh giá…"
            className={TEXTAREA_CLASS}
            {...register('reason')}
          />
          {errors.reason?.message ? (
            <p className="text-body-s text-sale">{errors.reason.message}</p>
          ) : (
            <p className="text-body-s text-slate">
              Bắt buộc khi từ chối hoặc ẩn đánh giá. Điểm sao sản phẩm được đồng bộ lại sau khi duyệt
              (BR-M10-03).
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
          <Button variant="outline" type="button" onClick={onClose} disabled={moderate.isPending}>
            Hủy
          </Button>
          <Button type="submit" loading={moderate.isPending} loadingLabel="Đang lưu…">
            Lưu kiểm duyệt
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * @param {{ open?: boolean, review?: object | null, onClose?: () => void, onSaved?: () => void }} props
 */
export default function ReviewModerationModal({ open = false, review = null, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Kiểm duyệt đánh giá"
      description="Đánh giá chỉ hiển thị công khai sau khi được duyệt (M10-F04)."
    >
      {open && review ? (
        <ModerationBody
          key={review.review_id}
          review={review}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
