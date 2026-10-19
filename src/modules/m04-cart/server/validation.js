import 'server-only';
import { z } from 'zod';
import { quantitySchema, uuidSchema, voucherCodeSchema } from '@/shared/validation/index.js';
import { MAX_QUANTITY_PER_ITEM } from './constants.js';

/** Zod schema theo API-M04-xx. */

const addCartItemBodySchema = z.object({
  product_id: uuidSchema,
  variant_id: uuidSchema.nullable().optional(),
  quantity: quantitySchema,
});

const updateCartItemBodySchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: 'Số lượng phải là số.' })
    .int('Số lượng phải là số nguyên.')
    .min(0, 'Số lượng không được âm.')
    .max(MAX_QUANTITY_PER_ITEM, `Số lượng tối đa ${MAX_QUANTITY_PER_ITEM} sản phẩm.`),
});

export const validationSchemas = Object.freeze({
  'API-M04-01': {},
  'API-M04-02': { body: addCartItemBodySchema },
  'API-M04-03': {
    params: z.object({ itemId: uuidSchema }),
    body: updateCartItemBodySchema,
  },
  'API-M04-04': { params: z.object({ itemId: uuidSchema }) },
  'API-M04-05': {
    body: z.object({
      item_ids: z.array(uuidSchema).min(1, 'Chọn ít nhất 1 sản phẩm.').max(50),
    }),
  },
  'API-M04-06': {
    body: z.object({
      guest_session_id: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9-]{8,64}$/, 'Guest session id không hợp lệ.'),
    }),
  },
  'API-M04-07': { body: z.object({ coupon_code: voucherCodeSchema }) },
});
