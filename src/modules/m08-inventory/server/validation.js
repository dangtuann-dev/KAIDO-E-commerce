import 'server-only';
import { z } from 'zod';
import { isoDateSchema, paginationQuerySchema, uuidSchema } from '@/shared/validation/index.js';
import { SKU_PATTERN } from './constants.js';

/** Zod schema theo API-M08-xx. */

const skuSchema = z
  .string({ required_error: 'SKU là bắt buộc.' })
  .trim()
  .toUpperCase()
  .regex(SKU_PATTERN, 'SKU gồm 3–30 ký tự chữ hoa, số hoặc dấu gạch ngang.');

const codeSchema = z
  .string({ required_error: 'Mã là bắt buộc.' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{2,20}$/, 'Mã gồm 2–20 ký tự chữ hoa, số hoặc dấu gạch ngang.');

const orderRefSchema = z.string().trim().min(1, 'Mã đơn là bắt buộc.').max(50);

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const optionalEmail = z
  .union([z.string().trim().email('Email không đúng định dạng.'), z.literal('')])
  .nullish()
  .transform((value) => (value ? value.toLowerCase() : null));

const optionalPhone = z
  .union([
    z
      .string()
      .trim()
      .regex(/^[0-9+\s().-]{8,20}$/, 'Số điện thoại không hợp lệ.'),
    z.literal(''),
  ])
  .nullish()
  .transform((value) => (value ? value : null));

const booleanQuery = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .optional()
  .transform((value) => value === true || value === 'true');

const documentStatusSchema = z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED']);

const adminPagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const stockItemSchema = z.object({
  sku: skuSchema,
  quantity: z.coerce.number().int().positive().max(10000),
});

const warehouseBodySchema = {
  code: codeSchema,
  name: z.string({ required_error: 'Tên kho là bắt buộc.' }).trim().min(2).max(100),
  address: optionalText(255),
  phone: optionalPhone,
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
};

const supplierBodySchema = {
  code: codeSchema,
  name: z.string({ required_error: 'Tên nhà cung cấp là bắt buộc.' }).trim().min(2).max(150),
  contact_name: optionalText(100),
  phone: optionalPhone,
  email: optionalEmail,
  address: optionalText(255),
  tax_code: optionalText(30),
  is_active: z.boolean().optional(),
};

function atLeastOneField(schema) {
  return schema.refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật.',
  });
}

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
      note: optionalText(500),
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
      items: z
        .array(
          z.object({
            sku: skuSchema,
            diff_quantity: z.coerce
              .number()
              .int()
              .refine((value) => value !== 0, 'Chênh lệch kiểm kê phải khác 0.'),
            reason: z.string().trim().min(10, 'Lý do điều chỉnh tối thiểu 10 ký tự.').max(500),
          }),
        )
        .min(1)
        .max(200),
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
  'API-M08-08': {
    query: z.object({
      keyword: z.string().trim().max(100).optional(),
      warehouse_id: uuidSchema.optional(),
      low_stock_only: booleanQuery,
      ...adminPagination,
    }),
  },
  'API-M08-09': {
    query: z.object({
      include_inactive: booleanQuery,
    }),
  },
  'API-M08-10': {
    body: z.object(warehouseBodySchema),
  },
  'API-M08-11': {
    params: z.object({ id: uuidSchema }),
    body: atLeastOneField(z.object(warehouseBodySchema).partial()),
  },
  'API-M08-12': {
    query: z.object({
      keyword: z.string().trim().max(100).optional(),
      include_inactive: booleanQuery,
    }),
  },
  'API-M08-13': {
    body: z.object(supplierBodySchema),
  },
  'API-M08-14': {
    params: z.object({ id: uuidSchema }),
    body: atLeastOneField(z.object(supplierBodySchema).partial()),
  },
  'API-M08-15': {
    query: z.object({
      warehouse_id: uuidSchema.optional(),
      supplier_id: uuidSchema.optional(),
      status: documentStatusSchema.optional(),
      ...adminPagination,
    }),
  },
  'API-M08-16': {
    query: z.object({
      warehouse_id: uuidSchema.optional(),
      status: documentStatusSchema.optional(),
      ...adminPagination,
    }),
  },
  'API-M08-17': {
    params: z.object({ id: uuidSchema }),
    body: z.object({
      action: z.enum(['APPROVE', 'CANCEL']),
      note: optionalText(500),
    }),
  },
  'API-M08-18': {
    query: z.object({
      status: documentStatusSchema.optional(),
      from_warehouse_id: uuidSchema.optional(),
      to_warehouse_id: uuidSchema.optional(),
      ...adminPagination,
    }),
  },
  'API-M08-19': {
    body: z
      .object({
        from_warehouse_id: uuidSchema,
        to_warehouse_id: uuidSchema,
        note: optionalText(500),
        items: z.array(stockItemSchema).min(1).max(200),
      })
      .superRefine((data, ctx) => {
        if (data.from_warehouse_id === data.to_warehouse_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['to_warehouse_id'],
            message: 'Kho đích phải khác kho nguồn.',
          });
        }
      }),
  },
  'API-M08-20': {
    params: z.object({ id: uuidSchema }),
    body: z.object({
      action: z.enum(['SHIP', 'RECEIVE', 'CANCEL']),
      note: optionalText(500),
    }),
  },
  'API-M08-21': {
    body: z.object({
      order_ref: orderRefSchema,
      warehouse_id: uuidSchema,
      note: optionalText(500),
      items: z
        .array(
          z.object({
            sku: skuSchema,
            quantity: z.coerce.number().int().positive().max(10000),
            condition: z.enum(['SELLABLE', 'DAMAGED']).default('SELLABLE'),
          }),
        )
        .min(1)
        .max(200),
    }),
  },
  'API-M08-22': {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(10),
    }),
  },
  'API-M08-23': {
    query: paginationQuerySchema.partial().optional(),
  },
});
