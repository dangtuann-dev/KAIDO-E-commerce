'use client';

/**
 * [TOY-M07] AdminVoucherForm — tạo voucher qua CouponService M09.
 * SRS: M07-F01 | API: API-M07-05 | BR: BR-M09-02
 * Route: /admin/loyalty/vouchers
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { createVoucher } from '../services/loyalty.api.js';

const TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Giảm theo phần trăm (%)' },
  { value: 'FIXED', label: 'Giảm số tiền cố định (đ)' },
  { value: 'FREESHIP', label: 'Miễn phí vận chuyển' },
];

const INTEGER = /^\d*$/;

const schema = z
  .object({
    code: z.string().trim().regex(/^[A-Za-z0-9]{4,20}$/, 'Mã từ 4 đến 20 ký tự, chỉ chữ và số.'),
    type: z.enum(['PERCENT', 'FIXED', 'FREESHIP']),
    value: z.string().trim().regex(INTEGER, 'Chỉ nhập số nguyên.'),
    max_discount: z.string().trim().regex(INTEGER, 'Chỉ nhập số nguyên.'),
    min_order: z.string().trim().regex(INTEGER, 'Chỉ nhập số nguyên.'),
    usage_limit: z.string().trim().regex(INTEGER, 'Chỉ nhập số nguyên.'),
    start_time: z.string(),
    end_time: z.string(),
  })
  .superRefine((values, ctx) => {
    const value = Number(values.value || 0);
    if (values.type === 'PERCENT' && (value < 1 || value > 100)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Giảm theo % phải từ 1 đến 100.' });
    }
    if (values.type === 'FIXED' && value <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Số tiền giảm phải lớn hơn 0.',
      });
    }
    if (
      values.start_time &&
      values.end_time &&
      new Date(values.end_time) <= new Date(values.start_time)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['end_time'],
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }
  });

/** Chuyển dữ liệu form sang đúng định dạng API-M07-05. */
function buildBody(values) {
  const body = {
    code: values.code.trim().toUpperCase(),
    type: values.type,
    value: values.type === 'FREESHIP' ? 0 : Number(values.value),
    min_order: Number(values.min_order || 0),
  };
  if (values.type === 'PERCENT' && values.max_discount) {
    body.max_discount = Number(values.max_discount);
  }
  if (values.usage_limit) body.usage_limit = Number(values.usage_limit);
  if (values.start_time) body.start_time = new Date(values.start_time).toISOString();
  if (values.end_time) body.end_time = new Date(values.end_time).toISOString();
  return body;
}

export default function AdminVoucherForm({ onCreated }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      type: 'PERCENT',
      value: '',
      max_discount: '',
      min_order: '0',
      usage_limit: '',
      start_time: '',
      end_time: '',
    },
  });

  const type = watch('type');

  async function onSubmit(values) {
    clearErrors('root');
    try {
      const body = buildBody(values);
      const created = await createVoucher({ body });
      onCreated?.({ ...created, type: body.type, value: body.value, min_order: body.min_order });
      toast.success(`Đã tạo mã ${created.code}.`);
      reset();
    } catch (error) {
      setError('root', {
        message: error.message || 'Không tạo được mã. Vui lòng thử lại.',
      });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {errors.root ? (
        <p
          role="alert"
          className="rounded-sm border border-sale/30 bg-sale/5 px-3 py-2 text-body-s text-sale"
        >
          {errors.root.message}
        </p>
      ) : null}

      <Input
        label="Mã giảm giá"
        placeholder="VD: TET2027"
        required
        error={errors.code?.message}
        {...register('code')}
      />

      <label className="flex flex-col gap-1.5 text-body-s font-semibold">
        Loại giảm giá
        <select
          className="rounded-sm border border-fog bg-white px-3 py-3 font-normal"
          {...register('type')}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {type !== 'FREESHIP' ? (
        <Input
          label={type === 'PERCENT' ? 'Giá trị (%)' : 'Số tiền giảm (đ)'}
          inputMode="numeric"
          required
          error={errors.value?.message}
          {...register('value')}
        />
      ) : null}

      {type === 'PERCENT' ? (
        <Input
          label="Giảm tối đa (đ)"
          hint="Để trống nếu không giới hạn."
          inputMode="numeric"
          error={errors.max_discount?.message}
          {...register('max_discount')}
        />
      ) : null}

      <Input
        label="Đơn tối thiểu (đ)"
        inputMode="numeric"
        error={errors.min_order?.message}
        {...register('min_order')}
      />

      <Input
        label="Số lượt dùng tối đa"
        hint="Để trống nếu không giới hạn."
        inputMode="numeric"
        error={errors.usage_limit?.message}
        {...register('usage_limit')}
      />

      <Input
        label="Bắt đầu"
        type="datetime-local"
        hint="Để trống nếu áp dụng ngay."
        error={errors.start_time?.message}
        {...register('start_time')}
      />

      <Input
        label="Kết thúc"
        type="datetime-local"
        hint="Để trống nếu hiệu lực 1 năm."
        error={errors.end_time?.message}
        {...register('end_time')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Tạo mã giảm giá
      </Button>
    </form>
  );
}
