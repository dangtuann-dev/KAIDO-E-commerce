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

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug tối thiểu 2 ký tự.')
  .max(200, 'Slug tối đa 200 ký tự.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.');

const optionalUrlSchema = z
  .union([z.string().trim().url('URL không hợp lệ.'), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

/** Ô số để trống phải thành null/undefined, không được coerce '' -> 0. */
const optionalPriceSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.coerce.number().int('Giá phải là số nguyên VND.').min(0).nullable().optional(),
);

const optionalStockThresholdSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().int().min(0).max(1000).optional(),
);

const productImageSchema = z.object({
  url: z.string().trim().url('URL ảnh không hợp lệ.'),
  alt_text: z.string().trim().max(160, 'Alt text tối đa 160 ký tự.').optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
});

const variantAttributesSchema = z.record(
  z.string().trim().max(50),
  z.union([z.string().trim().max(100), z.number(), z.boolean()]),
);

const productVariantSchema = z.object({
  id: uuidSchema.optional(),
  sku: skuSchema,
  name: z.string().trim().min(1, 'Tên biến thể là bắt buộc.').max(100),
  attributes: variantAttributesSchema.optional(),
  image_url: optionalUrlSchema,
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(999).optional(),
});

const productFields = {
  name: z
    .string({ required_error: 'Tên sản phẩm là bắt buộc.' })
    .trim()
    .min(5, 'Tên sản phẩm tối thiểu 5 ký tự.')
    .max(200, 'Tên sản phẩm tối đa 200 ký tự.'),
  sku: skuSchema,
  short_description: z.string().trim().max(500, 'Mô tả ngắn tối đa 500 ký tự.').optional(),
  description: z.string().trim().max(PRODUCT_DESCRIPTION_MAX_LENGTH).optional(),
  category_id: uuidSchema,
  category_ids: z.array(uuidSchema).max(5, 'Mỗi sản phẩm tối đa 5 danh mục.').optional(),
  brand_id: uuidSchema.nullable().optional(),
  age_group: z.enum(AGE_GROUP_VALUES, {
    required_error: 'Vui lòng chọn độ tuổi phù hợp.',
  }),
  gender_target: z.enum(GENDER_TARGET_VALUES),
  material: z.string().trim().max(100).optional(),
  origin_country: z.string().trim().max(100).optional(),
  safety_info: z.string().trim().max(1000).optional(),
  price_regular: z.coerce
    .number({ required_error: 'Giá niêm yết là bắt buộc.' })
    .int('Giá phải là số nguyên VND.')
    .positive('Giá niêm yết phải lớn hơn 0.'),
  price_sale: optionalPriceSchema,
  low_stock_threshold: optionalStockThresholdSchema,
  status: z.enum(PRODUCT_STATUS_VALUES),
  is_featured: z.boolean().optional(),
  meta_title: z.string().trim().max(255).optional(),
  meta_description: z.string().trim().max(500).optional(),
  images: z.array(productImageSchema).max(MAX_PRODUCT_IMAGES).optional(),
  variants: z.array(productVariantSchema).min(1).max(50).optional(),
};

function addPriceIssue(data, ctx) {
  if (data.price_sale != null && data.price_regular != null && data.price_sale > data.price_regular) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_sale'],
      message: 'Giá sale không được lớn hơn giá niêm yết (BR-M02-03).',
    });
  }
}

const createProductBodySchema = z
  .object({
    ...productFields,
    gender_target: z.enum(GENDER_TARGET_VALUES).default('UNISEX'),
    status: z.enum(PRODUCT_STATUS_VALUES).default('DRAFT'),
  })
  .superRefine(addPriceIssue);

const updateProductBodySchema = z
  .object(productFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần ít nhất một trường cập nhật.' });
      return;
    }
    addPriceIssue(data, ctx);
  });

const listProductsQuerySchema = paginationQuerySchema.extend({
  category_slug: z.string().trim().max(200).optional(),
  brand_slug: z.string().trim().max(200).optional(),
  keyword: searchKeywordSchema.optional(),
  sort: z.enum(SORT_OPTION_VALUES).optional(),
});

const listAdminProductsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PRODUCT_STATUS_VALUES).optional(),
  category_slug: z.string().trim().max(200).optional(),
  keyword: searchKeywordSchema.optional(),
  sort: z.enum(SORT_OPTION_VALUES).optional(),
});

const categoryFields = {
  name: z
    .string({ required_error: 'Tên danh mục là bắt buộc.' })
    .trim()
    .min(2, 'Tên danh mục tối thiểu 2 ký tự.')
    .max(120, 'Tên danh mục tối đa 120 ký tự.'),
  slug: slugSchema.optional(),
  parent_id: uuidSchema.nullable().optional(),
  description: z.string().trim().max(1000).optional(),
  icon_url: optionalUrlSchema,
  image_url: optionalUrlSchema,
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
  seo_title: z.string().trim().max(255).optional(),
  seo_description: z.string().trim().max(500).optional(),
};

const createCategoryBodySchema = z.object(categoryFields);

const updateCategoryBodySchema = z
  .object(categoryFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần ít nhất một trường cập nhật.' });
    }
  });

const brandFields = {
  name: z
    .string({ required_error: 'Tên thương hiệu là bắt buộc.' })
    .trim()
    .min(2, 'Tên thương hiệu tối thiểu 2 ký tự.')
    .max(100, 'Tên thương hiệu tối đa 100 ký tự.'),
  slug: slugSchema.optional(),
  logo_url: optionalUrlSchema,
  description: z.string().trim().max(1000).optional(),
  is_active: z.boolean().optional(),
};

const createBrandBodySchema = z.object(brandFields);

const updateBrandBodySchema = z
  .object(brandFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần ít nhất một trường cập nhật.' });
    }
  });

const idParamsSchema = z.object({ id: uuidSchema });

export const validationSchemas = Object.freeze({
  'API-M02-01': {},
  'API-M02-02': { query: listProductsQuerySchema },
  'API-M02-03': { params: z.object({ idOrSlug: z.string().trim().min(1).max(200) }) },
  'API-M02-04': { body: createProductBodySchema },
  'API-M02-05': { params: idParamsSchema, body: updateProductBodySchema },
  'API-M02-06': { params: idParamsSchema },
  'API-M02-07': {
    query: z.object({
      since_timestamp: z.coerce.number().int().min(0).optional(),
    }),
  },
  'API-M02-08': { query: listAdminProductsQuerySchema },
  'API-M02-09': { params: idParamsSchema },
  'API-M02-10': {},
  'API-M02-11': {},
  'API-M02-12': { body: createCategoryBodySchema },
  'API-M02-13': { params: idParamsSchema, body: updateCategoryBodySchema },
  'API-M02-14': { params: idParamsSchema },
  'API-M02-15': {},
  'API-M02-16': { body: createBrandBodySchema },
  'API-M02-17': { params: idParamsSchema, body: updateBrandBodySchema },
  'API-M02-18': { params: idParamsSchema },
});
