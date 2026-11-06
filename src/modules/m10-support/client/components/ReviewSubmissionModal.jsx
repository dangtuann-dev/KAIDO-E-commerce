'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — ReviewSubmissionModal
 * SRS: M10-F01, M10-F02 | API: API-M10-02, API-M10-08 | BR: BR-M10-01, BR-M10-05
 * Route: /products/[slug]
 * UI: Modal gửi/sửa đánh giá Verified Purchase — chọn sao, tiêu đề, nội dung và URL ảnh/video.
 * Đánh giá mới hoặc vừa sửa đều về trạng thái PENDING, chờ CSKH duyệt lại (M10-F04).
 */
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import StarRatingInput from './StarRatingInput.jsx';
import { MEDIA_LIMITS } from '../display.js';
import { useCreateReview } from '../hooks/use-create-review.js';
import { useUpdateReview } from '../hooks/use-update-review.js';
import {
  EMPTY_REVIEW_FORM,
  buildReviewFormSchema,
} from '../validation/support-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function ReviewFormBody({ review, productRef, productName, onClose, onSaved }) {
  const toast = useToast();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const editing = Boolean(review?.review_id);
  const pending = editing ? updateReview.isPending : createReview.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildReviewFormSchema({ editing })),
    defaultValues: editing
      ? {
          order_code: '',
          rating: review.rating ?? 5,
          title: review.title ?? '',
          comment: review.comment ?? '',
          images: (review.images ?? []).map((item) => item.url).join('\n'),
        }
      : { ...EMPTY_REVIEW_FORM },
  });

  async function onSubmit(values) {
    const images = values.images ?? [];
    try {
      if (editing) {
        const result = await updateReview.mutateAsync({
          id: review.review_id,
          body: {
            rating: values.rating,
            title: values.title?.trim() ?? '',
            comment: values.comment.trim(),
            images,
          },
        });
        toast.success(result?.message ?? 'Đã cập nhật đánh giá, đang chờ kiểm duyệt lại.');
      } else {
        const result = await createReview.mutateAsync({
          idOrSlug: productRef,
          body: {
            order_id: values.order_code.trim(),
            rating: values.rating,
            title: values.title?.trim() || undefined,
            comment: values.comment.trim(),
            images,
          },
        });
        toast.success(result?.message ?? 'Đã gửi đánh giá, đang chờ kiểm duyệt.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không lưu được đánh giá.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <p className="rounded-sm bg-fog/40 px-3 py-2 text-body-s text-slate">
        Đánh giá sản phẩm <strong className="text-ink">{productName ?? productRef}</strong>.{' '}
        {editing
          ? 'Nội dung sau khi sửa sẽ chờ kiểm duyệt lại trước khi hiển thị.'
          : 'Chỉ khách đã mua trong đơn hoàn tất mới gửi được (BR-M10-01).'}
      </p>

      {editing ? null : (
        <Input
          label="Mã đơn hàng đã hoàn tất"
          required
          placeholder="Ví dụ: #KD-00021"
          error={errors.order_code?.message}
          hint="Mã đơn có trong mục Đơn hàng của tài khoản, đơn phải chứa sản phẩm này."
          {...register('order_code')}
        />
      )}

      <Controller
        control={control}
        name="rating"
        render={({ field }) => (
          <StarRatingInput
            value={field.value}
            onChange={field.onChange}
            error={errors.rating?.message}
          />
        )}
      />

      <Input
        label="Tiêu đề (không bắt buộc)"
        placeholder="Ví dụ: Bé nhà mình rất thích"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-comment" className="text-body-s font-semibold text-ink">
          Nội dung đánh giá<span className="ml-1 text-sale" aria-hidden="true">*</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          placeholder={`Tối thiểu ${MEDIA_LIMITS.minTextLength} ký tự: chất lượng, đóng gói, trải nghiệm của bé…`}
          className={TEXTAREA_CLASS}
          {...register('comment')}
        />
        {errors.comment?.message ? (
          <p className="text-body-s text-sale">{errors.comment.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-images" className="text-body-s font-semibold text-ink">
          Ảnh / video (không bắt buộc)
        </label>
        <textarea
          id="review-images"
          rows={2}
          placeholder="Mỗi dòng một URL ảnh hoặc video"
          className={TEXTAREA_CLASS}
          {...register('images')}
        />
        {errors.images?.message ? (
          <p className="text-body-s text-sale">{errors.images.message}</p>
        ) : (
          <p className="text-body-s text-slate">
            Tối đa {MEDIA_LIMITS.maxFiles} ảnh và {MEDIA_LIMITS.maxVideoFiles} video (BR-M10-05).
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={pending}>
          Hủy
        </Button>
        <Button
          type="submit"
          loading={pending}
          loadingLabel={editing ? 'Đang lưu…' : 'Đang gửi…'}
        >
          {editing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  );
}

export default function ReviewSubmissionModal({
  open = false,
  review = null,
  productRef,
  productName = null,
  onClose,
  onSaved,
}) {
  const editing = Boolean(review?.review_id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Sửa đánh giá' : 'Viết đánh giá'}
      description={
        editing
          ? 'Đánh giá sau khi sửa sẽ chờ kiểm duyệt lại trước khi hiển thị (BR-M10-03).'
          : 'Đánh giá được kiểm duyệt trước khi hiển thị công khai (M10-F04).'
      }
    >
      {open ? (
        <ReviewFormBody
          key={review?.review_id ?? productRef ?? 'review'}
          review={review}
          productRef={productRef ?? review?.product_slug}
          productName={productName ?? review?.product_name ?? null}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
