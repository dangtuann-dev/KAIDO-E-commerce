import 'server-only';
import { z } from 'zod';
import { CARRIER_CODE_VALUES, SHIPPING_METHOD_VALUES } from '@/shared/constants/shipping.js';
import { RETURN_REASON_VALUES } from '@/shared/constants/support.js';
import { isoDateSchema, uuidSchema } from '@/shared/validation/index.js';

/** Zod schema theo API-M06-xx. */

const orderRefSchema = z.string().trim().min(1).max(50);

const shippingFeeBodySchema = z.object({
  address: z.object({
    province_code: z.string().trim().min(1),
    district_code: z.string().trim().optional(),
    ward_code: z.string().trim().min(1),
  }),
  weight: z.coerce.number().positive('Khối lượng phải lớn hơn 0.').max(100000),
  total_amount: z.coerce.number().int().min(0),
  shipping_method: z.enum(SHIPPING_METHOD_VALUES).optional(),
});

const returnRequestBodySchema = z.object({
  item_ids: z.array(uuidSchema).min(1, 'Chọn ít nhất 1 sản phẩm để đổi trả.').max(50),
  reason: z.enum(RETURN_REASON_VALUES),
  images: z
    .array(z.string().trim().url('URL ảnh không hợp lệ.'))
    .min(1, 'Cần ít nhất 1 ảnh hiện trạng (BR-M06-05).')
    .max(5),
  note: z.string().trim().max(1000).optional(),
});

const approveReturnBodySchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REJECT' && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'Cần nêu lý do khi từ chối yêu cầu đổi trả.',
      });
    }
  });

export const validationSchemas = Object.freeze({
  'API-M06-01': { body: shippingFeeBodySchema },
  'API-M06-02': {
    params: z.object({ orderRef: orderRefSchema }),
    body: z.object({
      carrier_code: z.enum(CARRIER_CODE_VALUES),
      pickup_time: isoDateSchema.optional(),
    }),
  },
  'API-M06-03': { params: z.object({ orderRef: orderRefSchema }) },
  'API-M06-04': {},
  'API-M06-05': {
    params: z.object({ orderRef: orderRefSchema }),
    body: z.object({
      reason: z.string().trim().min(5, 'Lý do hủy tối thiểu 5 ký tự.').max(500),
    }),
  },
  'API-M06-06': {
    params: z.object({ orderRef: orderRefSchema }),
    body: returnRequestBodySchema,
  },
  'API-M06-07': {
    params: z.object({ id: uuidSchema }),
    body: approveReturnBodySchema,
  },
});
