import 'server-only';
import { z } from 'zod';
import {
  REVIEW_MODERATION_ACTION_VALUES,
  TICKET_CATEGORY_VALUES,
} from '@/shared/constants/support.js';
import { uuidSchema } from '@/shared/validation/index.js';
import { REVIEW_LIMITS } from './constants.js';

/** Zod schema theo API-M10-xx. */

const productRefSchema = z.string().trim().min(1).max(200);
const ticketRefSchema = z.string().trim().min(3).max(50);

const reviewMediaSchema = z
  .array(z.string().trim().url('URL tệp không hợp lệ.'))
  .max(REVIEW_LIMITS.maxMediaFiles, `Tối đa ${REVIEW_LIMITS.maxMediaFiles} tệp đính kèm.`)
  .optional();

export const validationSchemas = Object.freeze({
  'API-M10-01': {
    params: z.object({ idOrSlug: productRefSchema }),
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(REVIEW_LIMITS.pageSize),
      stars: z.coerce.number().int().min(1).max(5).optional(),
    }),
  },
  'API-M10-02': {
    params: z.object({ idOrSlug: productRefSchema }),
    body: z.object({
      order_id: uuidSchema,
      rating: z.coerce
        .number()
        .int()
        .min(1, 'Số sao tối thiểu là 1.')
        .max(5, 'Số sao tối đa là 5.'),
      comment: z
        .string()
        .trim()
        .min(
          REVIEW_LIMITS.minTextLength,
          `Nội dung tối thiểu ${REVIEW_LIMITS.minTextLength} ký tự.`,
        )
        .max(REVIEW_LIMITS.maxTextLength, `Nội dung tối đa ${REVIEW_LIMITS.maxTextLength} ký tự.`),
      images: reviewMediaSchema,
    }),
  },
  'API-M10-03': {
    body: z.object({
      category: z.enum(TICKET_CATEGORY_VALUES),
      subject: z.string().trim().min(5, 'Tiêu đề tối thiểu 5 ký tự.').max(100),
      message: z.string().trim().min(10, 'Nội dung tối thiểu 10 ký tự.').max(5000),
      order_id: uuidSchema.optional(),
      files: reviewMediaSchema,
    }),
  },
  'API-M10-04': { params: z.object({ ticketRef: ticketRefSchema }) },
  'API-M10-05': {
    params: z.object({ ticketRef: ticketRefSchema }),
    body: z.object({
      message: z.string().trim().min(1, 'Nội dung phản hồi là bắt buộc.').max(5000),
      files: reviewMediaSchema,
    }),
  },
  'API-M10-06': {
    query: z.object({
      keyword: z.string().trim().max(100).optional(),
    }),
  },
  'API-M10-07': {
    params: z.object({ id: uuidSchema }),
    body: z
      .object({
        action: z.enum(REVIEW_MODERATION_ACTION_VALUES),
        reason: z.string().trim().max(500).optional(),
      })
      .superRefine((data, ctx) => {
        if ((data.action === 'REJECT' || data.action === 'HIDE') && !data.reason) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reason'],
            message: 'Cần nêu lý do khi từ chối hoặc ẩn đánh giá.',
          });
        }
      }),
  },
});
