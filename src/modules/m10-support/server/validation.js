import 'server-only';
import { z } from 'zod';
import {
  REVIEW_MODERATION_ACTION_VALUES,
  REVIEW_STATUS_VALUES,
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
} from '@/shared/constants/support.js';
import { uuidSchema } from '@/shared/validation/index.js';
import { DEFAULT_LIST_LIMIT, REVIEW_LIMITS } from './constants.js';

/** Zod schema theo API-M10-xx. */

const productRefSchema = z.string().trim().min(1).max(200);
const ticketRefSchema = z.string().trim().min(3).max(50);
/** Mã đơn (#KD-…) hoặc UUID — M05 tự phân giải bằng findOrderByRef. */
const orderRefSchema = z.string().trim().min(3, 'Mã đơn hàng quá ngắn.').max(50);

/** Chỉ nhận URL tệp (quy ước dự án: không upload qua Storage). */
const mediaUrlSchema = z.string().trim().url('URL tệp không hợp lệ.');
const reviewMediaSchema = z
  .array(mediaUrlSchema)
  .max(REVIEW_LIMITS.maxMediaFiles, `Tối đa ${REVIEW_LIMITS.maxMediaFiles} tệp đính kèm.`)
  .optional();

const booleanQuerySchema = z.enum(['true', 'false']).optional();

function paginationQuery({ defaultLimit = DEFAULT_LIST_LIMIT, maxLimit = 50 } = {}) {
  return {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
  };
}

const listParams = z.object({ id: uuidSchema });

export const validationSchemas = Object.freeze({
  'API-M10-01': {
    params: z.object({ idOrSlug: productRefSchema }),
    query: z.object({
      ...paginationQuery({ defaultLimit: REVIEW_LIMITS.pageSize }),
      stars: z.coerce.number().int().min(1).max(5).optional(),
    }),
  },
  'API-M10-02': {
    params: z.object({ idOrSlug: productRefSchema }),
    body: z.object({
      order_id: orderRefSchema,
      rating: z.coerce
        .number()
        .int()
        .min(1, 'Số sao tối thiểu là 1.')
        .max(5, 'Số sao tối đa là 5.'),
      title: z.string().trim().max(100, 'Tiêu đề tối đa 100 ký tự.').optional(),
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
      order_id: orderRefSchema.optional(),
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
      category: z.string().trim().max(100).optional(),
    }),
  },
  'API-M10-07': {
    params: listParams,
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
  'API-M10-08': {
    params: listParams,
    body: z
      .object({
        rating: z.coerce.number().int().min(1).max(5).optional(),
        title: z.string().trim().max(100).optional(),
        comment: z
          .string()
          .trim()
          .min(REVIEW_LIMITS.minTextLength)
          .max(REVIEW_LIMITS.maxTextLength)
          .optional(),
        images: reviewMediaSchema,
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'Cần ít nhất một trường để cập nhật đánh giá.',
      }),
  },
  'API-M10-09': { params: listParams },
  'API-M10-10': { query: z.object(paginationQuery()) },
  'API-M10-11': {
    params: listParams,
    body: z.object({
      content: z.string().trim().min(5, 'Phản hồi tối thiểu 5 ký tự.').max(1000),
    }),
  },
  'API-M10-12': {
    query: z.object({
      ...paginationQuery(),
      status: z.enum(REVIEW_STATUS_VALUES).optional(),
      rating: z.coerce.number().int().min(1).max(5).optional(),
      product_id: uuidSchema.optional(),
      keyword: z.string().trim().max(100).optional(),
    }),
  },
  'API-M10-13': {
    query: z.object({
      ...paginationQuery(),
      status: z.enum(TICKET_STATUS_VALUES).optional(),
    }),
  },
  'API-M10-14': {
    query: z.object({
      ...paginationQuery(),
      status: z.enum(TICKET_STATUS_VALUES).optional(),
      category: z.enum(TICKET_CATEGORY_VALUES).optional(),
      priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
      assigned_to: uuidSchema.optional(),
      keyword: z.string().trim().max(100).optional(),
    }),
  },
  'API-M10-15': { params: listParams },
  'API-M10-16': {
    params: listParams,
    body: z
      .object({
        action: z.enum(['ASSIGN', 'REPLY', 'RESOLVE', 'CLOSE', 'REOPEN']),
        assigned_to: uuidSchema.optional(),
        priority: z.enum(TICKET_PRIORITY_VALUES).optional(),
        message: z.string().trim().min(1).max(5000).optional(),
        files: reviewMediaSchema,
        note: z.string().trim().max(500).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.action === 'ASSIGN' && !data.assigned_to) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['assigned_to'],
            message: 'Cần chọn nhân viên xử lý khi phân công ticket.',
          });
        }
        if (data.action === 'REPLY' && !data.message) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['message'],
            message: 'Cần nhập nội dung phản hồi cho khách.',
          });
        }
      }),
  },
  'API-M10-17': { query: z.object({}) },
  'API-M10-18': {
    query: z.object({
      keyword: z.string().trim().max(100).optional(),
      category_id: uuidSchema.optional(),
      include_inactive: booleanQuerySchema,
    }),
  },
  'API-M10-19': {
    body: z.object({
      category_id: uuidSchema,
      question: z.string().trim().min(10, 'Câu hỏi tối thiểu 10 ký tự.').max(300),
      answer: z.string().trim().min(20, 'Câu trả lời tối thiểu 20 ký tự.').max(5000),
      sort_order: z.coerce.number().int().min(0).max(9999).optional(),
      is_active: z.boolean().optional(),
    }),
  },
  'API-M10-20': {
    params: listParams,
    body: z
      .object({
        category_id: uuidSchema.optional(),
        question: z.string().trim().min(10).max(300).optional(),
        answer: z.string().trim().min(20).max(5000).optional(),
        sort_order: z.coerce.number().int().min(0).max(9999).optional(),
        is_active: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'Cần ít nhất một trường để cập nhật câu hỏi.',
      }),
  },
  'API-M10-21': { params: listParams },
  'API-M10-22': { query: z.object({ include_inactive: booleanQuerySchema }) },
  'API-M10-23': {
    body: z.object({
      name: z.string().trim().min(2, 'Tên nhóm tối thiểu 2 ký tự.').max(100),
      slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch nối.')
        .max(100)
        .optional(),
      sort_order: z.coerce.number().int().min(0).max(9999).optional(),
      is_active: z.boolean().optional(),
    }),
  },
});
