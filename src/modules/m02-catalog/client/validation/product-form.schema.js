/**
 * [TOY-M02] Schema form sản phẩm phía client — phản chiếu validation server.
 * Server (server/validation.js) là nguồn sự thật; file này không import server-only
 * nên dùng được trong Client Component. Quy tắc: M02-F04, F07, F08, BR-M02-01, BR-M02-03.
 */
import { z } from 'zod';
import { AGE_GROUP_VALUES, GENDER_TARGET_VALUES, PRODUCT_STATUS_VALUES } from '@/shared/constants/product.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKU_PATTERN = /^[A-Za-z0-9-]{3,30}$/;

const imageRowSchema = z.object({
  url: z.string().trim().optional(),
  alt_text: z.string().trim().max(160, 'Alt text tối đa 160 ký tự.').optional(),
  is_primary: z.boolean().optional(),
});

const variantRowSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().optional(),
  name: z.string().trim().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const productFormSchema = z
  .object({
    name: z
      .string({ required_error: 'Tên sản phẩm là bắt buộc.' })
      .trim()
      .min(5, 'Tên sản phẩm tối thiểu 5 ký tự.')
      .max(200, 'Tên sản phẩm tối đa 200 ký tự.'),
    sku: z
      .string({ required_error: 'SKU là bắt buộc.' })
      .trim()
      .regex(SKU_PATTERN, 'SKU gồm 3–30 ký tự chữ, số hoặc dấu gạch ngang.'),
    category_id: z
      .string({ required_error: 'Vui lòng chọn danh mục chính.' })
      .trim()
      .regex(UUID_PATTERN, 'Danh mục không hợp lệ.'),
    brand_id: z
      .string()
      .trim()
      .regex(UUID_PATTERN, 'Thương hiệu không hợp lệ.')
      .optional()
      .or(z.literal('')),
    age_group: z.enum(AGE_GROUP_VALUES, {
      required_error: 'Vui lòng chọn độ tuổi phù hợp.',
    }),
    gender_target: z.enum(GENDER_TARGET_VALUES),
    status: z.enum(PRODUCT_STATUS_VALUES),
    price_regular: z
      .number({ required_error: 'Giá niêm yết là bắt buộc.' })
      .int('Giá phải là số nguyên VND.')
      .positive('Giá niêm yết phải lớn hơn 0.'),
    price_sale: z
      .number()
      .int('Giá phải là số nguyên VND.')
      .min(0, 'Giá sale không được âm.')
      .nullable()
      .optional(),
    low_stock_threshold: z
      .number()
      .int('Ngưỡng phải là số nguyên.')
      .min(0, 'Ngưỡng không được âm.')
      .max(1000, 'Ngưỡng tối đa 1000.')
      .optional(),
    is_featured: z.boolean().optional(),
    short_description: z.string().trim().max(500, 'Mô tả ngắn tối đa 500 ký tự.').optional(),
    description: z.string().trim().max(5000, 'Mô tả tối đa 5.000 ký tự.').optional(),
    material: z.string().trim().max(100, 'Chất liệu tối đa 100 ký tự.').optional(),
    origin_country: z.string().trim().max(100, 'Xuất xứ tối đa 100 ký tự.').optional(),
    safety_info: z.string().trim().max(1000, 'Lưu ý an toàn tối đa 1.000 ký tự.').optional(),
    meta_title: z.string().trim().max(255, 'Meta title tối đa 255 ký tự.').optional(),
    meta_description: z.string().trim().max(500, 'Meta description tối đa 500 ký tự.').optional(),
    images: z.array(imageRowSchema).max(10, 'Tối đa 10 ảnh mỗi sản phẩm (M02-F07).').optional(),
    variants: z.array(variantRowSchema).max(50, 'Tối đa 50 biến thể.').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.price_sale != null && data.price_sale > data.price_regular) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price_sale'],
        message: 'Giá sale không được lớn hơn giá niêm yết (BR-M02-03).',
      });
    }

    for (const [index, image] of (data.images ?? []).entries()) {
      if (image.url && !isHttpUrl(image.url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['images', index, 'url'],
          message: 'URL ảnh không hợp lệ.',
        });
      }
    }

    const seenSkus = new Set();
    for (const [index, variant] of (data.variants ?? []).entries()) {
      const sku = variant.sku?.trim();
      const name = variant.name?.trim();

      if (!sku && !name) continue;

      if (!sku) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'sku'],
          message: 'SKU biến thể là bắt buộc.',
        });
      } else if (!SKU_PATTERN.test(sku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'sku'],
          message: 'SKU gồm 3–30 ký tự chữ, số hoặc dấu gạch ngang.',
        });
      } else if (seenSkus.has(sku.toUpperCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'sku'],
          message: 'SKU biến thể bị trùng trong danh sách.',
        });
      } else {
        seenSkus.add(sku.toUpperCase());
      }

      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'name'],
          message: 'Tên biến thể là bắt buộc.',
        });
      }
    }
  });

export const EMPTY_PRODUCT_FORM = Object.freeze({
  name: '',
  sku: '',
  category_id: '',
  brand_id: '',
  age_group: '3-6Y',
  gender_target: 'UNISEX',
  status: 'DRAFT',
  price_regular: undefined,
  price_sale: null,
  low_stock_threshold: 5,
  is_featured: false,
  short_description: '',
  description: '',
  material: '',
  origin_country: '',
  safety_info: '',
  meta_title: '',
  meta_description: '',
  images: [],
  variants: [],
});
