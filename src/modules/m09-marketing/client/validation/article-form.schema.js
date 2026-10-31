/**
 * [TOY-M09] Schema form bài viết phía client — phản chiếu server/validation.js.
 * Quy tắc: M09-F02, M09-F05 (hẹn giờ xuất bản), NFR-M09-01 (SEO/OpenGraph).
 */
import { z } from 'zod';

export const ARTICLE_STATUS_VALUES = Object.freeze([
  'DRAFT',
  'PENDING_APPROVAL',
  'PUBLISHED',
  'ARCHIVED',
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const articleFormSchema = z.object({
  title: z
    .string({ required_error: 'Tiêu đề là bắt buộc.' })
    .trim()
    .min(5, 'Tiêu đề tối thiểu 5 ký tự.')
    .max(200, 'Tiêu đề tối đa 200 ký tự.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(200, 'Slug tối đa 200 ký tự.')
    .optional()
    .refine((value) => !value || SLUG_PATTERN.test(value), 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'),
  category_id: z.string().optional(),
  excerpt: z.string().trim().max(500, 'Mô tả ngắn tối đa 500 ký tự.').optional(),
  content: z
    .string({ required_error: 'Nội dung là bắt buộc.' })
    .trim()
    .min(20, 'Nội dung tối thiểu 20 ký tự.')
    .max(50000, 'Nội dung tối đa 50.000 ký tự.'),
  cover_image_url: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isHttpUrl(value), 'URL ảnh không hợp lệ (phải bắt đầu bằng http).'),
  status: z.enum(ARTICLE_STATUS_VALUES),
  published_at: z.string().optional(),
  meta_title: z.string().trim().max(70, 'Meta title tối đa 70 ký tự.').optional(),
  meta_description: z.string().trim().max(160, 'Meta description tối đa 160 ký tự.').optional(),
});

export const EMPTY_ARTICLE_FORM = Object.freeze({
  title: '',
  slug: '',
  category_id: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  status: 'DRAFT',
  published_at: '',
  meta_title: '',
  meta_description: '',
});
