/**
 * [TOY-M09] Schema form banner phía client — phản chiếu server/validation.js.
 * Quy tắc: M09-F01, M09-F05, BR-M09-04 (tối đa 5 banner HOME_HERO).
 */
import { z } from 'zod';

export const BANNER_POSITION_VALUES = Object.freeze([
  'HOME_HERO',
  'HOME_PROMO',
  'CATEGORY',
  'SIDEBAR',
]);

export const BANNER_STATUS_VALUES = Object.freeze([
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isHttpUrl(value), 'URL không hợp lệ (phải bắt đầu bằng http).');

const bannerImageUrl = z
  .string({ required_error: 'Vui lòng nhập URL ảnh banner.' })
  .trim()
  .min(1, 'Vui lòng nhập URL ảnh banner.')
  .refine(isHttpUrl, 'URL ảnh không hợp lệ (phải bắt đầu bằng http).')
  .refine(
    (value) => /\.(jpe?g|png|webp)$/.test(value.split('?')[0].toLowerCase()),
    'Ảnh banner phải là jpg, png hoặc webp.',
  );

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Tiêu đề tối thiểu 3 ký tự.').max(150, 'Tiêu đề tối đa 150 ký tự.'),
    image_url: bannerImageUrl,
    mobile_image_url: optionalUrl,
    target_url: optionalUrl,
    position: z.enum(BANNER_POSITION_VALUES),
    display_order: z.coerce.number().int().min(0).max(9999).default(0),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    status: z.enum(BANNER_STATUS_VALUES),
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.start_time && data.end_time && Date.parse(data.end_time) <= Date.parse(data.start_time)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }
  });

export const EMPTY_BANNER_FORM = Object.freeze({
  title: '',
  image_url: '',
  mobile_image_url: '',
  target_url: '',
  position: 'HOME_HERO',
  display_order: 0,
  start_time: '',
  end_time: '',
  status: 'DRAFT',
  is_active: true,
});
