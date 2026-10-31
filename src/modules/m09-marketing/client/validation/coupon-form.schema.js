/**
 * [TOY-M09] Schema form mã giảm giá phía client — phản chiếu server/validation.js.
 * Quy tắc: M09-F04, M09-F08 (CouponService), BR-M09-01 (phạm vi & hiệu lực).
 * Chế độ sửa chỉ cho thay đổi điều kiện/giới hạn/hiệu lực — mã, loại giảm và
 * phạm vi đã chốt lúc tạo nên không gửi lại trong payload.
 */
import { z } from 'zod';

export const COUPON_TYPE_VALUES = Object.freeze(['PERCENT', 'FIXED', 'FREESHIP']);

export const COUPON_SCOPE_VALUES = Object.freeze(['ALL', 'CATEGORY', 'PRODUCT', 'SHIPPING']);

export const COUPON_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const emptyToNull = (value) => (value === '' || value === null || value === undefined ? null : value);

const nullableAmount = z.preprocess(
  emptyToNull,
  z.coerce.number().int('Giá trị phải là số nguyên.').min(0, 'Giá trị không được âm.').nullable(),
);

const nullableQuantity = z.preprocess(
  emptyToNull,
  z.coerce.number().int('Giới hạn phải là số nguyên.').positive('Giới hạn phải lớn hơn 0.').nullable(),
);

const targetsField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.split(/[\s,;]+/).filter(Boolean) : []))
  .refine(
    (list) => list.every((id) => UUID_PATTERN.test(id)),
    'Mỗi đối tượng phải là mã UUID hợp lệ, phân tách bằng dấu phẩy.',
  );

/**
 * @param {{ editing?: boolean, discountType?: string | null }} [options]
 * Chế độ sửa bỏ qua mã/loại giảm/phạm vi/bắt đầu hiệu lực vì server không cho đổi;
 * `discountType` lấy từ bản ghi để vẫn kiểm tra đúng ràng buộc giá trị.
 */
export function buildCouponFormSchema({ editing = false, discountType = null } = {}) {
  return z
    .object({
      code: editing
        ? z.string().optional()
        : z
            .string({ required_error: 'Mã giảm giá là bắt buộc.' })
            .trim()
            .toUpperCase()
            .refine((value) => COUPON_CODE_PATTERN.test(value), 'Mã gồm 4–20 ký tự chữ và số.'),
      name: z.string().trim().max(150, 'Tên chương trình tối đa 150 ký tự.').optional(),
      description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự.').optional(),
      type: editing ? z.enum(COUPON_TYPE_VALUES).optional() : z.enum(COUPON_TYPE_VALUES),
      value: z.coerce
        .number({ required_error: 'Vui lòng nhập giá trị giảm.' })
        .int('Giá trị phải là số nguyên.')
        .min(0, 'Giá trị không được âm.'),
      max_discount: nullableAmount,
      min_order: nullableAmount,
      scope: editing ? z.enum(COUPON_SCOPE_VALUES).optional() : z.enum(COUPON_SCOPE_VALUES),
      applicable_targets: targetsField,
      usage_limit: nullableQuantity,
      usage_limit_per_user: nullableQuantity,
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      is_active: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      const type = discountType ?? data.type;

      if (!editing) {
        if (!data.start_time) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['start_time'],
            message: 'Vui lòng chọn thời điểm bắt đầu hiệu lực.',
          });
        }
        if (!data.end_time) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['end_time'],
            message: 'Vui lòng chọn thời điểm kết thúc hiệu lực.',
          });
        }
      }

      if (
        data.start_time &&
        data.end_time &&
        Date.parse(data.end_time) <= Date.parse(data.start_time)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_time'],
          message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
        });
      }

      if (type === 'PERCENT' && !(data.value >= 1 && data.value <= 100)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Mã giảm theo % phải có giá trị 1–100.',
        });
      }
      if (type === 'FIXED' && data.value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Mã giảm số tiền phải lớn hơn 0.',
        });
      }
      if (
        ['PRODUCT', 'CATEGORY'].includes(data.scope) &&
        data.applicable_targets.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['applicable_targets'],
          message: 'Phạm vi theo sản phẩm/danh mục cần ít nhất một mã đối tượng.',
        });
      }
    });
}

export const EMPTY_COUPON_FORM = Object.freeze({
  code: '',
  name: '',
  description: '',
  type: 'PERCENT',
  value: '',
  max_discount: '',
  min_order: '',
  scope: 'ALL',
  applicable_targets: '',
  usage_limit: '',
  usage_limit_per_user: '',
  start_time: '',
  end_time: '',
  is_active: true,
});
