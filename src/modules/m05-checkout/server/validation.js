import 'server-only';
import { z } from 'zod';
import { ORDER_STATUS_VALUES } from '@/shared/constants/order-status.js';
import { PAYMENT_METHOD_VALUES } from '@/shared/constants/payment.js';
import { SHIPPING_METHOD_VALUES } from '@/shared/constants/shipping.js';
import {
  fullNameSchema,
  isoDateSchema,
  optionalEmailSchema,
  paginationQuerySchema,
  phoneSchema,
  quantitySchema,
  streetAddressSchema,
  uuidSchema,
  voucherCodeSchema,
} from '@/shared/validation/index.js';

/** Zod schema theo API-M05-xx. */

const orderRefSchema = z
  .string({ required_error: 'Mã đơn hàng là bắt buộc.' })
  .trim()
  .min(1)
  .max(50)
  .refine(
    (value) => /^KD-\d{6}-[A-Z0-9]{6}$/.test(value) || z.string().uuid().safeParse(value).success,
    'Mã đơn hàng không hợp lệ.',
  );

const regionCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{1,6}$/, 'Mã địa phương không hợp lệ.')
  .optional();

const shippingAddressSchema = z.object({
  recipient_name: fullNameSchema,
  recipient_phone: phoneSchema,
  recipient_email: optionalEmailSchema,
  province: z.string().trim().min(1).max(100),
  province_code: regionCodeSchema,
  district: z.string().trim().max(100).optional(),
  district_code: regionCodeSchema,
  ward: z.string().trim().min(1).max(100),
  ward_code: regionCodeSchema,
  address_line: streetAddressSchema,
});

const checkoutItemSchema = z.object({
  product_id: uuidSchema,
  variant_id: uuidSchema.nullable().optional(),
  quantity: quantitySchema,
});

const customerOrderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUS_VALUES).optional(),
});

const adminOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  search: z.string().trim().max(100).optional(),
  from_date: isoDateSchema.optional(),
  to_date: isoDateSchema.optional(),
});

export const validationSchemas = Object.freeze({
  'API-M05-01': {
    body: z
      .object({
        item_ids: z.array(uuidSchema).min(1).max(50),
        address_id: uuidSchema.optional(),
        shipping_address: shippingAddressSchema.optional(),
        shipping_method: z.enum(SHIPPING_METHOD_VALUES).optional(),
        coupon_code: voucherCodeSchema.optional(),
        points_redeemed: z.coerce
          .number()
          .int()
          .min(0)
          .refine((value) => value % 10 === 0, 'Điểm tiêu phải là bội số của 10.')
          .default(0),
      })
      .refine((value) => Boolean(value.address_id) || Boolean(value.shipping_address), {
        message: 'Cần chọn địa chỉ đã lưu hoặc nhập địa chỉ giao hàng.',
        path: ['address_id'],
      }),
  },
  'API-M05-02': {
    body: z.object({
      shipping_address: shippingAddressSchema,
      address_id: uuidSchema.optional(),
      payment_method: z.enum(PAYMENT_METHOD_VALUES),
      shipping_method: z.enum(SHIPPING_METHOD_VALUES).default('STANDARD'),
      note: z.string().trim().max(500).optional(),
      items: z.array(checkoutItemSchema).min(1).max(50),
      coupon_code: voucherCodeSchema.optional(),
      points_redeemed: z.coerce
        .number()
        .int()
        .min(0)
        .refine((value) => value % 10 === 0, 'Điểm tiêu phải là bội số của 10.')
        .optional()
        .default(0),
    }),
  },
  'API-M05-03': { params: z.object({ orderRef: orderRefSchema }), query: customerOrderQuerySchema },
  'API-M05-04': {},
  'API-M05-05': {
    params: z.object({ orderRef: orderRefSchema }),
    body: z.object({
      reason: z.string().trim().min(5, 'Lý do hủy tối thiểu 5 ký tự.').max(500),
    }),
  },
  'API-M05-06': { query: adminOrdersQuerySchema },
  'API-M05-07': {
    params: z.object({ id: uuidSchema }),
    body: z.object({
      new_status: z.enum(ORDER_STATUS_VALUES),
      note: z.string().trim().max(500).optional(),
    }),
  },
});
