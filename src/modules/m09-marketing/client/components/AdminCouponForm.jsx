'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCouponForm
 * SRS: M09-F04, M09-F08 | API: API-M09-05, API-M09-22 | BR: BR-M09-01
 * Route: /admin/marketing/coupons
 * UI: Modal tạo/sửa mã giảm giá qua CouponService — loại giảm, giá trị, mức giảm
 * tối đa, đơn tối thiểu, phạm vi áp dụng, giới hạn lượt dùng và hiệu lực.
 * Khi sửa: mã, loại giảm, phạm vi và mốc bắt đầu đã chốt nên chỉ đọc.
 */
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import {
  COUPON_SCOPE_LABELS,
  DISCOUNT_TYPE_LABELS,
  formatDateTime,
  fromDateTimeInput,
  toDateTimeInput,
} from '../display.js';
import { useCreateCoupon } from '../hooks/use-create-coupon.js';
import { useUpdateCoupon } from '../hooks/use-update-coupon.js';
import {
  COUPON_SCOPE_VALUES,
  COUPON_TYPE_VALUES,
  EMPTY_COUPON_FORM,
  buildCouponFormSchema,
} from '../validation/coupon-form.schema.js';

const TEXTAREA_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const TYPE_OPTIONS = COUPON_TYPE_VALUES.map((value) => ({
  value,
  label: DISCOUNT_TYPE_LABELS[value] ?? value,
}));

const SCOPE_OPTIONS = COUPON_SCOPE_VALUES.map((value) => ({
  value,
  label: COUPON_SCOPE_LABELS[value] ?? value,
}));

function toFormValues(coupon) {
  if (!coupon?.id) return { ...EMPTY_COUPON_FORM };
  return {
    code: coupon.code ?? '',
    name: coupon.name ?? '',
    description: coupon.description ?? '',
    type: coupon.discount_type ?? 'PERCENT',
    value: coupon.discount_value ?? '',
    max_discount: coupon.max_discount_amount ?? '',
    min_order: coupon.min_order_amount ?? '',
    scope: coupon.scope ?? 'ALL',
    applicable_targets: (coupon.applicable_targets ?? []).join(', '),
    usage_limit: coupon.usage_limit ?? '',
    usage_limit_per_user: coupon.usage_limit_per_user ?? '',
    start_time: toDateTimeInput(coupon.valid_from),
    end_time: toDateTimeInput(coupon.valid_to),
    is_active: coupon.is_active !== false,
  };
}

function buildCreatePayload(values) {
  const payload = {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value: Number(values.value) || 0,
    max_discount: values.type === 'PERCENT' ? (values.max_discount ?? null) : null,
    min_order: values.min_order ?? 0,
    scope: values.scope,
    applicable_targets: ['PRODUCT', 'CATEGORY'].includes(values.scope)
      ? values.applicable_targets
      : [],
    usage_limit: values.usage_limit ?? null,
    usage_limit_per_user: values.usage_limit_per_user ?? null,
    start_time: fromDateTimeInput(values.start_time),
    end_time: fromDateTimeInput(values.end_time),
  };
  if (values.name?.trim()) payload.name = values.name.trim();
  if (values.description?.trim()) payload.description = values.description.trim();
  return payload;
}

function buildUpdatePayload(values, discountType) {
  const payload = {
    value: Number(values.value) || 0,
    max_discount: discountType === 'PERCENT' ? (values.max_discount ?? null) : null,
    min_order: values.min_order ?? 0,
    usage_limit: values.usage_limit ?? null,
    usage_limit_per_user: values.usage_limit_per_user ?? null,
    end_time: fromDateTimeInput(values.end_time),
    is_active: Boolean(values.is_active),
    description: values.description?.trim() || null,
  };
  if (values.name?.trim()) payload.name = values.name.trim();
  return payload;
}

/** Dòng chỉ đọc cho các trường đã chốt lúc tạo mã (server không cho sửa). */
function SummaryItem({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-body-s font-semibold text-slate">{label}</dt>
      <dd className="break-all text-body-s text-ink">{value}</dd>
    </div>
  );
}

function CouponFormBody({ coupon, onClose, onSaved }) {
  const toast = useToast();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const saving = createCoupon.isPending || updateCoupon.isPending;
  const editing = Boolean(coupon?.id);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      buildCouponFormSchema({ editing, discountType: coupon?.discount_type ?? null }),
    ),
    defaultValues: toFormValues(coupon),
  });

  const watchedType = useWatch({ control, name: 'type' });
  const watchedScope = useWatch({ control, name: 'scope' });
  // Khi sửa, mã/loại giảm/phạm vi không còn trong form nên lấy thẳng từ bản ghi.
  const type = editing ? (coupon.discount_type ?? watchedType) : watchedType;
  const scope = editing ? (coupon.scope ?? watchedScope) : watchedScope;
  const needsTargets = !editing && ['PRODUCT', 'CATEGORY'].includes(scope);
  const targets = editing ? (coupon.applicable_targets ?? []) : [];

  async function onSubmit(values) {
    try {
      if (editing) {
        await updateCoupon.mutateAsync({
          id: coupon.id,
          body: buildUpdatePayload(values, coupon.discount_type),
        });
        toast.success(`Đã cập nhật mã ${coupon.code}.`);
      } else {
        await createCoupon.mutateAsync({ body: buildCreatePayload(values) });
        toast.success('Đã tạo mã giảm giá mới.');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.message ?? 'Không lưu được mã giảm giá.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {editing ? (
        <dl className="grid gap-3 rounded-md border border-fog bg-fog/30 px-4 py-3 sm:grid-cols-2">
          <SummaryItem label="Mã giảm giá" value={coupon.code} />
          <SummaryItem
            label="Loại giảm giá"
            value={DISCOUNT_TYPE_LABELS[type] ?? type ?? '—'}
          />
          <SummaryItem label="Phạm vi áp dụng" value={COUPON_SCOPE_LABELS[scope] ?? scope ?? '—'} />
          <SummaryItem label="Bắt đầu hiệu lực" value={formatDateTime(coupon.valid_from)} />
          {targets.length ? (
            <SummaryItem label="Đối tượng áp dụng" value={targets.join(', ')} />
          ) : null}
        </dl>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {editing ? null : (
          <Input
            label="Mã giảm giá"
            required
            error={errors.code?.message}
            hint="4–20 ký tự chữ và số, không dấu."
            placeholder="TOY2026"
            {...register('code')}
          />
        )}
        <Input
          label="Tên chương trình"
          error={errors.name?.message}
          placeholder="Ví dụ: Ưu đãi Trung Thu 2026"
          {...register('name')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="coupon-description" className="text-body-s font-semibold text-ink">
          Mô tả hiển thị cho khách
        </label>
        <textarea
          id="coupon-description"
          rows={2}
          placeholder="Điều kiện áp dụng ngắn gọn, hiển thị cùng mã trên trang khuyến mãi."
          className={TEXTAREA_CLASS}
          {...register('description')}
        />
        {errors.description?.message ? (
          <p className="text-body-s text-sale">{errors.description.message}</p>
        ) : null}
      </div>

      <div className={editing ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-3'}>
        {editing ? null : (
          <Select
            label="Loại giảm giá"
            options={TYPE_OPTIONS}
            error={errors.type?.message}
            {...register('type')}
          />
        )}
        <Input
          label={type === 'PERCENT' ? 'Giá trị (%)' : 'Giá trị (VND)'}
          type="number"
          min="0"
          required
          error={errors.value?.message}
          {...register('value')}
        />
        <Input
          label="Mức giảm tối đa (VND)"
          type="number"
          min="0"
          error={errors.max_discount?.message}
          hint={type === 'PERCENT' ? 'Không bắt buộc.' : 'Chỉ áp dụng cho mã %.'}
          disabled={type !== 'PERCENT'}
          {...register('max_discount')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Đơn tối thiểu (VND)"
          type="number"
          min="0"
          error={errors.min_order?.message}
          {...register('min_order')}
        />
        <Input
          label="Giới hạn tổng lượt dùng"
          type="number"
          min="1"
          error={errors.usage_limit?.message}
          hint={editing ? `Đã dùng ${coupon.actual_usage_count ?? coupon.used_count ?? 0} lượt.` : 'Để trống = không giới hạn.'}
          {...register('usage_limit')}
        />
        <Input
          label="Giới hạn lượt/khách"
          type="number"
          min="1"
          error={errors.usage_limit_per_user?.message}
          hint="Để trống = không giới hạn."
          {...register('usage_limit_per_user')}
        />
      </div>

      {editing ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Phạm vi áp dụng"
            options={SCOPE_OPTIONS}
            error={errors.scope?.message}
            {...register('scope')}
          />
          <Input
            label="Bắt đầu hiệu lực"
            type="datetime-local"
            error={errors.start_time?.message}
            {...register('start_time')}
          />
        </div>
      )}

      {needsTargets ? (
        <Input
          label="Mã đối tượng áp dụng"
          error={errors.applicable_targets?.message}
          hint="Danh sách UUID sản phẩm/danh mục, phân tách bằng dấu phẩy (BR-M09-01)."
          placeholder="3f1c...-..., 8a92...-..."
          {...register('applicable_targets')}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Kết thúc hiệu lực"
          type="datetime-local"
          required
          error={errors.end_time?.message}
          hint="Cron tự ngừng áp dụng khi quá hạn."
          {...register('end_time')}
        />
        {editing ? (
          <div className="flex items-end pb-2">
            <Checkbox label="Đang áp dụng cho đơn mới" {...register('is_active')} />
          </div>
        ) : (
          <p className="flex items-end pb-2 text-body-s text-slate">
            Mã mới được bật ngay sau khi tạo; tắt trong lần sửa kế tiếp nếu cần.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog pt-4">
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
          {editing ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCouponForm({ open = false, coupon = null, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={coupon?.id ? `Sửa mã ${coupon.code}` : 'Tạo mã giảm giá'}
      description="Coupon dùng chung cho giỏ hàng, thanh toán và hạng thành viên (M09-F04, F08)."
    >
      {open ? (
        <CouponFormBody
          key={coupon?.id ?? 'new'}
          coupon={coupon}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
