import { z } from 'zod';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { VN_PHONE_REGEX } from '@/shared/utils/phone.js';

/**
 * [SHARED] Schema Zod dùng chung — SRS M01 validation, M03/M04/M05/M07/M09/M10.
 * Schema riêng của module nằm trong thư mục server/validation.js của từng module.
 */

export const emailSchema = z
  .string({ required_error: 'Email là bắt buộc.' })
  .trim()
  .min(1, 'Email là bắt buộc.')
  .max(100, 'Email tối đa 100 ký tự.')
  .email('Email không đúng định dạng.');

export const optionalEmailSchema = z
  .union([emailSchema, z.literal('')])
  .optional()
  .transform((value) => (value ? value : null));

export const phoneSchema = z
  .string({ required_error: 'Số điện thoại là bắt buộc.' })
  .trim()
  .regex(VN_PHONE_REGEX, 'Số điện thoại không hợp lệ (10 số, bắt đầu 03/05/07/08/09).');

export const passwordSchema = z
  .string({ required_error: 'Mật khẩu là bắt buộc.' })
  .min(8, 'Mật khẩu tối thiểu 8 ký tự.')
  .max(32, 'Mật khẩu tối đa 32 ký tự.')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa.')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường.')
  .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số.');

export const fullNameSchema = z
  .string({ required_error: 'Họ tên là bắt buộc.' })
  .trim()
  .min(2, 'Họ tên tối thiểu 2 ký tự.')
  .max(50, 'Họ tên tối đa 50 ký tự.')
  .regex(/^[\p{L}\s]+$/u, 'Họ tên chỉ gồm chữ cái và khoảng trắng.');

export const recipientNameSchema = fullNameSchema;

export const streetAddressSchema = z
  .string({ required_error: 'Địa chỉ là bắt buộc.' })
  .trim()
  .min(5, 'Địa chỉ cần ít nhất 5 ký tự.')
  .max(255, 'Địa chỉ tối đa 255 ký tự.');

export const provinceCodeSchema = z.string().trim().min(1, 'Vui lòng chọn Tỉnh/Thành phố.');
export const districtCodeSchema = z.string().trim().optional().nullable();
export const wardCodeSchema = z.string().trim().min(1, 'Vui lòng chọn Phường/Xã.');

export const voucherCodeSchema = z
  .string({ required_error: 'Mã giảm giá là bắt buộc.' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,20}$/, 'Mã giảm giá gồm 4–20 ký tự chữ và số.');

export const quantitySchema = z.coerce
  .number({ invalid_type_error: 'Số lượng phải là số.' })
  .int('Số lượng phải là số nguyên.')
  .min(1, 'Số lượng tối thiểu là 1.')
  .max(BUSINESS_RULES.CART.MAX_QUANTITY_PER_ITEM, 'Số lượng tối đa là 20 sản phẩm/lần đặt.');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(BUSINESS_RULES.CATALOG.DEFAULT_PAGE_SIZE),
});

export const uuidSchema = z.string().uuid('Mã định danh không hợp lệ.');

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const isoDateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Ngày không hợp lệ.');

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số.');

export const searchKeywordSchema = z
  .string()
  .trim()
  .min(1, 'Từ khóa tối thiểu 1 ký tự.')
  .max(
    BUSINESS_RULES.CATALOG.MAX_SEARCH_KEYWORD_LENGTH,
    `Từ khóa tối đa ${BUSINESS_RULES.CATALOG.MAX_SEARCH_KEYWORD_LENGTH} ký tự.`,
  );

/** Trả về danh sách lỗi thân thiện để đưa vào error.details của envelope. */
export function formatZodError(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error('VALIDATION_ERROR');
    error.name = 'ZodValidationError';
    error.issues = formatZodError(result.error);
    throw error;
  }
  return result.data;
}
