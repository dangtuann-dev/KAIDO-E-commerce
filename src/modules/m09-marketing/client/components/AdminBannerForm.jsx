'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminBannerForm
 * SRS: M09-F01, M09-F05 | API: API-M09-04, API-M09-10 | BR: BR-M09-04
 * Route: /admin/marketing/banners
 * UI: Modal thêm/sửa banner — ảnh nhập bằng URL (nền tảng chưa có endpoint upload),
 * lịch hiển thị, thứ tự và trạng thái; tối đa 5 banner HOME_HERO đang bật.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { BANNER_POSITION_LABELS, CONTENT_STATUS_LABELS, fromDateTimeInput, toDateTimeInput } from '../display.js';
import { useCreateBanner } from '../hooks/use-create-banner.js';
import { useUpdateBanner } from '../hooks/use-update-banner.js';
import {
  BANNER_POSITION_VALUES,
  BANNER_STATUS_VALUES,
  EMPTY_BANNER_FORM,
  bannerFormSchema,
} from '../validation/banner-form.schema.js';

const POSITION_OPTIONS = BANNER_POSITION_VALUES.map((value) => ({
  value,
  label: BANNER_POSITION_LABELS[value] ?? value,
}));

const STATUS_OPTIONS = BANNER_STATUS_VALUES.map((value) => ({
  value,
  label: CONTENT_STATUS_LABELS[value] ?? value,
}));

function toFormValues(banner) {
  if (!banner?.id) return { ...EMPTY_BANNER_FORM };
  return {
    title: banner.title ?? '',
    image_url: banner.image_url ?? '',
    mobile_image_url: banner.mobile_image_url ?? '',
    target_url: banner.target_url ?? '',
    position: banner.position ?? 'HOME_HERO',
    display_order: banner.display_order ?? 0,
    start_time: toDateTimeInput(banner.start_time),
    end_time: toDateTimeInput(banner.end_time),
    status: banner.status ?? 'DRAFT',
    is_active: banner.is_active !== false,
  };
}

function BannerFormBody({ banner, onClose, onSaved }) {
  const toast = useToast();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const saving = createBanner.isPending || updateBanner.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: toFormValues(banner),
  });

  async function onSubmit(values) {
    const payload = {
      title: values.title.trim(),
      image_url: values.image_url.trim(),
      mobile_image_url: values.mobile_image_url?.trim() || null,
      target_url: values.target_url?.trim() || null,
      position: values.position,
      display_order: Number(values.display_order) || 0,
      start_time: fromDateTimeInput(values.start_time),
      end_time: fromDateTimeInput(values.end_time),
      status: values.status,
      is_active: Boolean(values.is_active),
    };

    try {
      if (banner?.id) {
        await updateBanner.mutateAsync({ id: banner.id, body: payload });
        toast.success('Đã cập nhật banner.');
      } else {
        await createBanner.mutateAsync({ body: payload });
        toast.success('Đã thêm banner mới.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không lưu được banner.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Tiêu đề banner"
        required
        error={errors.title?.message}
        placeholder="Ví dụ: Ưu đãi Trung Thu 2026"
        {...register('title')}
      />

      <Input
        label="URL ảnh banner"
        required
        error={errors.image_url?.message}
        hint="JPG/PNG/WebP, tối đa 2MB. Dùng ảnh đã tải lên Storage của KAIDO."
        placeholder="https://mjkiigjzuaebruqhovlj.supabase.co/storage/v1/object/public/kaido-media/banner.webp"
        {...register('image_url')}
      />

      <Input
        label="URL ảnh mobile"
        error={errors.mobile_image_url?.message}
        hint="Không bắt buộc — dùng ảnh tỉ lệ dọc cho điện thoại."
        placeholder="https://..."
        {...register('mobile_image_url')}
      />

      <Input
        label="Liên kết đích"
        error={errors.target_url?.message}
        hint="Đường dẫn nội bộ (/promotions) hoặc URL đầy đủ (https://...)."
        placeholder="/promotions"
        {...register('target_url')}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Vị trí"
          options={POSITION_OPTIONS}
          error={errors.position?.message}
          {...register('position')}
        />
        <Input
          label="Thứ tự hiển thị"
          type="number"
          min="0"
          max="9999"
          error={errors.display_order?.message}
          {...register('display_order')}
        />
        <Select
          label="Trạng thái"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Bắt đầu hiển thị"
          type="datetime-local"
          error={errors.start_time?.message}
          hint="Để trống nếu hiển thị ngay."
          {...register('start_time')}
        />
        <Input
          label="Kết thúc hiển thị"
          type="datetime-local"
          error={errors.end_time?.message}
          hint="Cron sẽ tự tắt banner khi quá hạn."
          {...register('end_time')}
        />
      </div>

      <Checkbox
        label="Bật hiển thị ngay (banner HOME_HERO chỉ được bật tối đa 5)"
        {...register('is_active')}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
          {banner?.id ? 'Lưu thay đổi' : 'Thêm banner'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminBannerForm({ open = false, banner = null, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={banner?.id ? 'Sửa banner' : 'Thêm banner'}
      description="Banner hiển thị theo vị trí, thứ tự và lịch đã cấu hình (M09-F01, M09-F05)."
    >
      {open ? (
        <BannerFormBody
          key={banner?.id ?? 'new'}
          banner={banner}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
