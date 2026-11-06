/**
 * [TOY-M10] Schema form phía client — phản chiếu server/validation.js.
 * Quy tắc: M10-F01/F02 (đánh giá), M10-F06/F07 (ticket), M10-F09 (FAQ), BR-M10-05.
 * Tệp đính kèm chỉ là URL (quy ước dự án: không upload qua Storage).
 */
import { z } from 'zod';
import { TICKET_CATEGORY_VALUES, TICKET_PRIORITY_VALUES } from '@/shared/constants/support.js';
import { MEDIA_LIMITS } from '../display.js';

const MAX_ATTACHMENTS = MEDIA_LIMITS.maxFiles + MEDIA_LIMITS.maxVideoFiles;

/**
 * Textarea nhận nhiều URL, mỗi dòng một tệp.
 * @param {number} [max]
 */
function fileListField(max = MAX_ATTACHMENTS) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.split(/[\r\n]+/).map((item) => item.trim()).filter(Boolean) : []))
    .refine((list) => list.length <= max, `Tối đa ${max} tệp đính kèm.`)
    .refine(
      (list) => list.every((url) => z.string().url().safeParse(url).success),
      'Mỗi dòng phải là URL tệp hợp lệ (bắt đầu bằng http/https).',
    );
}

/** Số URL ảnh tối đa — kiểm tra thêm vì trường chỉ đếm tổng số tệp. */
function countVideoUrls(list = []) {
  return list.filter((url) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)).length;
}

/** M10-F01/F02 — gửi/sửa đánh giá (Verified Purchase). */
export function buildReviewFormSchema({ editing = false } = {}) {
  return z
    .object({
      order_code: editing
        ? z.string().optional()
        : z
            .string({ required_error: 'Mã đơn hàng là bắt buộc để xác thực đã mua.' })
            .trim()
            .min(3, 'Nhập mã đơn hàng đã hoàn tất.')
            .max(50, 'Mã đơn hàng tối đa 50 ký tự.'),
      rating: z.coerce
        .number({ required_error: 'Vui lòng chọn số sao.' })
        .int()
        .min(1, 'Số sao tối thiểu là 1.')
        .max(5, 'Số sao tối đa là 5.'),
      title: z.string().trim().max(100, 'Tiêu đề tối đa 100 ký tự.').optional(),
      comment: z
        .string({ required_error: 'Vui lòng nhập nội dung đánh giá.' })
        .trim()
        .min(MEDIA_LIMITS.minTextLength, `Nội dung tối thiểu ${MEDIA_LIMITS.minTextLength} ký tự.`)
        .max(MEDIA_LIMITS.maxTextLength, `Nội dung tối đa ${MEDIA_LIMITS.maxTextLength} ký tự.`),
      images: fileListField(MEDIA_LIMITS.maxFiles),
    })
    .refine((data) => countVideoUrls(data.images) <= MEDIA_LIMITS.maxVideoFiles, {
      path: ['images'],
      message: `Mỗi đánh giá chỉ đính kèm tối đa ${MEDIA_LIMITS.maxVideoFiles} video.`,
    });
}

export const EMPTY_REVIEW_FORM = Object.freeze({
  order_code: '',
  rating: 5,
  title: '',
  comment: '',
  images: '',
});

/** M10-F06 — tạo ticket hỗ trợ. */
export function buildTicketFormSchema() {
  return z.object({
    category: z.enum(TICKET_CATEGORY_VALUES, {
      required_error: 'Chọn chủ đề cần hỗ trợ.',
    }),
    subject: z
      .string({ required_error: 'Vui lòng nhập tiêu đề.' })
      .trim()
      .min(5, 'Tiêu đề tối thiểu 5 ký tự.')
      .max(100, 'Tiêu đề tối đa 100 ký tự.'),
    message: z
      .string({ required_error: 'Vui lòng mô tả vấn đề.' })
      .trim()
      .min(10, 'Nội dung tối thiểu 10 ký tự.')
      .max(5000, 'Nội dung tối đa 5000 ký tự.'),
    order_id: z.string().trim().optional(),
    files: fileListField(),
  });
}

export const EMPTY_TICKET_FORM = Object.freeze({
  category: 'ORDER_ISSUE',
  subject: '',
  message: '',
  order_id: '',
  files: '',
});

/** M10-F07 — khách phản hồi trong hội thoại ticket. */
export const ticketReplyFormSchema = z.object({
  message: z
    .string({ required_error: 'Vui lòng nhập nội dung phản hồi.' })
    .trim()
    .min(1, 'Nội dung phản hồi là bắt buộc.')
    .max(5000, 'Nội dung tối đa 5000 ký tự.'),
  files: fileListField(),
});

export const EMPTY_TICKET_REPLY_FORM = Object.freeze({ message: '', files: '' });

/** M10-F08 — CSKH phản hồi khách trong ticket. */
export const staffReplyFormSchema = z.object({
  message: z
    .string({ required_error: 'Vui lòng nhập nội dung phản hồi.' })
    .trim()
    .min(1, 'Nội dung phản hồi là bắt buộc.')
    .max(5000, 'Nội dung tối đa 5000 ký tự.'),
  files: fileListField(),
  priority: z.enum(TICKET_PRIORITY_VALUES).optional().or(z.literal('')),
});

export const EMPTY_STAFF_REPLY_FORM = Object.freeze({ message: '', files: '', priority: '' });

/** M10-F04 — kiểm duyệt đánh giá, bắt buộc lý do khi từ chối/ẩn. */
export const moderationFormSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'HIDE'], { required_error: 'Chọn hành động.' }),
    reason: z.string().trim().max(500, 'Lý do tối đa 500 ký tự.').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action !== 'APPROVE' && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Cần nêu lý do khi từ chối hoặc ẩn đánh giá.',
      });
    }
  });

export const EMPTY_MODERATION_FORM = Object.freeze({ action: 'APPROVE', reason: '' });

/** M10-F09 — tạo/sửa câu hỏi thường gặp. */
export const faqFormSchema = z.object({
  category_id: z.string({ required_error: 'Chọn nhóm câu hỏi.' }).trim().min(1, 'Chọn nhóm câu hỏi.'),
  question: z
    .string({ required_error: 'Vui lòng nhập câu hỏi.' })
    .trim()
    .min(10, 'Câu hỏi tối thiểu 10 ký tự.')
    .max(300, 'Câu hỏi tối đa 300 ký tự.'),
  answer: z
    .string({ required_error: 'Vui lòng nhập câu trả lời.' })
    .trim()
    .min(20, 'Câu trả lời tối thiểu 20 ký tự.')
    .max(5000, 'Câu trả lời tối đa 5000 ký tự.'),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

export const EMPTY_FAQ_FORM = Object.freeze({
  category_id: '',
  question: '',
  answer: '',
  sort_order: 0,
  is_active: true,
});

/** M10-F09 — tạo nhóm câu hỏi; slug bỏ trống thì server tự sinh. */
export const faqCategoryFormSchema = z.object({
  name: z
    .string({ required_error: 'Vui lòng nhập tên nhóm.' })
    .trim()
    .min(2, 'Tên nhóm tối thiểu 2 ký tự.')
    .max(100, 'Tên nhóm tối đa 100 ký tự.'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch nối.')
    .max(100)
    .optional()
    .or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const EMPTY_FAQ_CATEGORY_FORM = Object.freeze({ name: '', slug: '', sort_order: 0 });
