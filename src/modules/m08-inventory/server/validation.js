import 'server-only';
import { z } from 'zod';
import { isoDateSchema, uuidSchema } from '@/shared/validation/index.js';
import { SKU_PATTERN } from './constants.js';

/** Zod schema theo API-M08-xx. */

const skuSchema = z
  .string({ required_error: 'SKU là bắt buộc.' })
  .trim()
  .toUpperCase()
  .regex(SKU_PATTERN, 'SKU gồm 3–30 ký tự chữ hoa, số hoặc dấu gạch ngang.');

const orderRefSchema = z.string().trim().min(1).max(50);

const stockItemSchema = z.object({
  sku: skuSchema,
  quantity: z.coerce.number().int().positive().max(10000),
});

const adjustmentItemSchema = z.object({
  sku: skuSchema,
  diff_quantity: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, 'Chênh lệch kiểm kê phải khác 0.'),
  reason: z.string().trim().min(10, 'Lý do điều chỉnh tối thiểu 10 ký tự.').max(500),
});

export const validationSchemas = Object.freeze({
  'API-M08-01': {
    query: z.object({
      skus: z
        .string({ required_error: 'Danh sách SKU là bắt buộc.' })
        .trim()
        .min(1)
        .transform((value) =>
          value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        )
        .pipe(z.array(skuSchema).min(1).max(50)),
    }),
  },
  'API-M08-02': {
    body: z.object({
      order_ref: orderRefSchema,
      items: z.array(stockItemSchema).min(1).max(100),
    }),
  },
  'API-M08-03': {
    body: z.object({
      order_ref: orderRefSchema,
      reservation_id: uuidSchema.optional(),
    }),
  },
  'API-M08-04': {
    body: z.object({
      order_ref: orderRefSchema,
      reservation_id: uuidSchema.optional(),
    }),
  },
  'API-M08-05': {
    body: z.object({
      supplier_id: uuidSchema,
      warehouse_id: uuidSchema,
      items: z
        .array(
          z.object({
            sku: skuSchema,
            quantity: z.coerce.number().int().positive().max(100000),
            unit_cost: z.coerce.number().int().min(0),
            vat_rate: z.coerce.number().min(0).max(100).optional(),
          }),
        )
        .min(1)
        .max(200),
    }),
  },
  'API-M08-06': {
    body: z.object({
      warehouse_id: uuidSchema,
      items: z.array(adjustmentItemSchema).min(1).max(200),
    }),
  },
  'API-M08-07': {
    query: z
      .object({
        sku: skuSchema,
        warehouse_id: uuidSchema,
        from_date: isoDateSchema.optional(),
        to_date: isoDateSchema.optional(),
      })
      .superRefine((data, ctx) => {
        if (
          data.from_date &&
          data.to_date &&
          Date.parse(data.to_date) < Date.parse(data.from_date)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['to_date'],
            message: 'to_date phải sau hoặc bằng from_date.',
          });
        }
      }),
  },
});
