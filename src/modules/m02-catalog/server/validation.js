import 'server-only';
import { z } from 'zod';
import {
  AGE_GROUP_VALUES,
  GENDER_TARGET_VALUES,
  PRODUCT_STATUS_VALUES,
  SORT_OPTION_VALUES,
} from '@/shared/constants/product.js';
import {
  paginationQuerySchema,
  searchKeywordSchema,
  uuidSchema,
} from '@/shared/validation/index.js';
import { MAX_PRODUCT_IMAGES, PRODUCT_DESCRIPTION_MAX_LENGTH } from './constants.js';

/** Zod schema theo API-M02-xx. */

const skuSchema = z
  .string({ required_error: 'SKU là bắt buộc.' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{3,30}$/, 'SKU gồm 3–30 ký tự chữ hoa, số hoặc dấu gạch ngang.');

const productImageSchema = z.object({
  url: z.string().trim().url('URL ảnh không hợp lệ.'),
  alt_text: z.string().trim().max(160).optional(),
  is_primary: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).default(0),
});

const productVariantSchema = z.object({
  sku: skuSchema,
  name: z.string().trim().min(1).max(100),
  price: z.coerce.number().int('Giá phải là số nguyên VND.').min(0),
  stock: z.coerce.number().int().min(0).optional(),
});

const productBodyBase = z.object({
  name: z.string().trim().min(5, 'Tên sản phẩm tối thiểu 5 ký tự.').max(200),
  sku: skuSchema,
  short_description: z.string().trim().max(500).optional(),
  description: z.string().trim().max(PRODUCT_DESCRIPTION_MAX_LENGTH).optional(),
  category_id: uuidSchema,
  brand_id: uuidSchema.nullable().optional(),
  age_group: z.enum(AGE_GROUP_VALUES),
  gender_target: z.enum(GENDER_TARGET_VALUES).default('UNISEX'),
  material: z.string().trim().max(100).optional(),
  origin_country: z.string().trim().max(100).optional(),
  safety_info: z.string().trim().max(1000).optional(),
  price_regular: z.coerce.number().int('Giá phải là số nguyên VND.').positive(),
  price_sale: z.coerce.number().int().min(0).nullable().optional(),
  low_stock_threshold: z.coerce.number().int().min(0).max(1000).optional(),
  status: z.enum(PRODUCT_STATUS_VALUES).default('DRAFT'),
  images: z.array(productImageSchema).max(MAX_PRODUCT_IMAGES).optional(),
  variants: z.array(productVariantSchema).min(1).max(50).optional(),
});

const productPriceRule = (data) => data.price_sale == null || data.price_sale <= data.price_regular;

const createProductBodySchema = productBodyBase.superRefine((data, ctx) => {
  if (!productPriceRule(data)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_sale'],
      message: 'Giá sale không được lớn hơn giá niêm yết (BR-M02-03).',
    });
  }
});

const updateProductBodySchema = productBodyBase.partial();

const listProductsQuerySchema = paginationQuerySchema.extend({
  category_slug: z.string().trim().max(100).optional(),
  brand_slug: z.string().trim().max(100).optional(),
  keyword: searchKeywordSchema.optional(),
  sort: z.enum(SORT_OPTION_VALUES).optional(),
});

export const validationSchemas = Object.freeze({
  'API-M02-01': {},
  'API-M02-02': { query: listProductsQuerySchema },
  'API-M02-03': { params: z.object({ idOrSlug: z.string().trim().min(1).max(200) }) },
  'API-M02-04': { body: createProductBodySchema },
  'API-M02-05': {
    params: z.object({ id: uuidSchema }),
    body: updateProductBodySchema,
  },
  'API-M02-06': { params: z.object({ id: uuidSchema }) },
  'API-M02-07': {
    query: z.object({
      since_timestamp: z.coerce.number().int().min(0).optional(),
    }),
  },
});
