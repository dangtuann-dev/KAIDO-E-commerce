import 'server-only';
import { z } from 'zod';
import { DISCOUNT_TYPE_VALUES } from '@/shared/constants/loyalty.js';
import {
  isoDateSchema,
  paginationQuerySchema,
  uuidSchema,
  voucherCodeSchema,
} from '@/shared/validation/index.js';
import { REDEEM_POINT_MULTIPLE } from './constants.js';

/** Zod schema theo API-M07-xx. */

const pointsSchema = z.coerce
  .number({ invalid_type_error: 'Điểm phải là số.' })
  .int('Điểm phải là số nguyên.')
  .min(0, 'Điểm không được âm.');

const redeemPointsSchema = pointsSchema.refine(
  (value) => value % REDEEM_POINT_MULTIPLE === 0,
  `Điểm tiêu phải là bội số của ${REDEEM_POINT_MULTIPLE}.`,
);

const createVoucherBodySchema = z
  .object({
    code: voucherCodeSchema,
    type: z.enum(DISCOUNT_TYPE_VALUES),
    value: z.coerce.number().int().min(0),
    max_discount: z.coerce.number().int().min(0).optional(),
    min_order: z.coerce.number().int().min(0).default(0),
    usage_limit: z.coerce.number().int().positive().optional(),
    start_time: isoDateSchema.optional(),
    end_time: isoDateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'PERCENT' && !(data.value >= 1 && data.value <= 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Voucher PERCENT phải có giá trị 1–100.',
      });
    }
    if (data.type === 'FIXED' && data.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Voucher FIXED phải có giá trị lớn hơn 0.',
      });
    }
    if (
      data.start_time &&
      data.end_time &&
      Date.parse(data.end_time) <= Date.parse(data.start_time)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }
  });

export const validationSchemas = Object.freeze({
  'API-M07-01': {
    body: z.object({
      code: voucherCodeSchema,
      order_subtotal: z.coerce.number().int().min(0),
      customer_id: uuidSchema.optional(),
    }),
  },
  'API-M07-02': {},
  'API-M07-03': {
    query: paginationQuerySchema.extend({
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  },
  'API-M07-04': {
    body: z.object({
      points_redeemed: redeemPointsSchema,
      voucher_code: voucherCodeSchema.optional(),
      subtotal: z.coerce.number().int().min(0),
    }),
  },
  'API-M07-05': { body: createVoucherBodySchema },
  'API-M07-06': {},
});
