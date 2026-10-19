import 'server-only';
import { z } from 'zod';
import { DISCOUNT_TYPE_VALUES } from '@/shared/constants/loyalty.js';
import {
  isoDateSchema,
  paginationQuerySchema,
  uuidSchema,
  voucherCodeSchema,
} from '@/shared/validation/index.js';
import { BANNER_POSITION_VALUES, CONTENT_STATUS } from './constants.js';

/** Zod schema theo API-M09-xx. */

const bannerPositionSchema = z
  .string()
  .trim()
  .transform((value) => (value.toLowerCase() === 'home_main' ? 'HOME_HERO' : value.toUpperCase()))
  .pipe(z.enum(BANNER_POSITION_VALUES));

const createCouponBodySchema = z
  .object({
    code: voucherCodeSchema,
    type: z.enum(DISCOUNT_TYPE_VALUES),
    value: z.coerce.number().int().min(0),
    min_order: z.coerce.number().int().min(0).default(0),
    usage_limit: z.coerce.number().int().positive().optional(),
    start_time: isoDateSchema,
    end_time: isoDateSchema,
  })
  .superRefine((data, ctx) => {
    if (Date.parse(data.end_time) <= Date.parse(data.start_time)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'end_time phải sau start_time.',
      });
    }
    if (data.type === 'PERCENT' && !(data.value >= 1 && data.value <= 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Coupon PERCENT phải có giá trị 1–100.',
      });
    }
    if (data.type === 'FIXED' && data.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Coupon FIXED phải có giá trị lớn hơn 0.',
      });
    }
  });

export const validationSchemas = Object.freeze({
  'API-M09-01': {
    query: z.object({
      position: bannerPositionSchema.optional(),
    }),
  },
  'API-M09-02': {},
  'API-M09-03': {
    body: z.object({
      code: voucherCodeSchema,
      order_amount: z.coerce.number().int().min(0),
      customer_id: uuidSchema.optional(),
      items: z
        .array(
          z.object({
            product_id: uuidSchema,
            variant_id: uuidSchema.nullable().optional(),
            quantity: z.coerce.number().int().positive(),
            unit_price: z.coerce.number().int().min(0),
          }),
        )
        .max(100)
        .optional(),
    }),
  },
  'API-M09-04': {
    body: z
      .object({
        title: z.string().trim().min(3).max(150),
        image_url: z.string().trim().url('URL ảnh không hợp lệ.'),
        target_url: z.string().trim().url('URL đích không hợp lệ.').optional(),
        position: bannerPositionSchema,
        start_time: isoDateSchema.optional(),
        end_time: isoDateSchema.optional(),
        display_order: z.coerce.number().int().min(0).optional(),
        status: z.enum(Object.values(CONTENT_STATUS)).default('DRAFT'),
      })
      .superRefine((data, ctx) => {
        if (
          data.start_time &&
          data.end_time &&
          Date.parse(data.end_time) <= Date.parse(data.start_time)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['end_time'],
            message: 'end_time phải sau start_time.',
          });
        }
      }),
  },
  'API-M09-05': { body: createCouponBodySchema },
  'API-M09-06': {
    query: paginationQuerySchema.extend({
      category: z.string().trim().max(100).optional(),
    }),
  },
});
