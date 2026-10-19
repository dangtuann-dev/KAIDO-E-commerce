import 'server-only';
import { z } from 'zod';
import {
  AGE_GROUP_VALUES,
  GENDER_TARGET_VALUES,
  SORT_OPTION_VALUES,
} from '@/shared/constants/product.js';
import {
  isoDateSchema,
  paginationQuerySchema,
  searchKeywordSchema,
  uuidSchema,
} from '@/shared/validation/index.js';

/** Zod schema theo API-M03-xx. */

const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

const csvUuidListSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) =>
    value
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
  )
  .pipe(z.array(uuidSchema).max(20).optional());

const csvAgeGroupListSchema = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value.split(',').map((item) => item.trim()) : undefined))
  .pipe(z.array(z.enum(AGE_GROUP_VALUES)).max(AGE_GROUP_VALUES.length).optional());

const searchQuerySchema = paginationQuerySchema
  .extend({
    keyword: z.string().trim().max(100, 'Từ khóa tối đa 100 ký tự (BR-M03-02).').optional(),
    category_id: csvUuidListSchema,
    brand_id: csvUuidListSchema,
    price_min: z.coerce.number().int().min(0).optional(),
    price_max: z.coerce.number().int().positive().optional(),
    age_group: csvAgeGroupListSchema,
    gender: z.enum(GENDER_TARGET_VALUES).optional(),
    in_stock: booleanQuerySchema.optional(),
    on_sale: booleanQuerySchema.optional(),
    sort: z.enum(SORT_OPTION_VALUES).default('relevance'),
  })
  .superRefine((data, ctx) => {
    if (data.price_min != null && data.price_max != null && data.price_min > data.price_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price_min'],
        message: 'price_min phải nhỏ hơn hoặc bằng price_max.',
      });
    }
  });

export const validationSchemas = Object.freeze({
  'API-M03-01': { query: searchQuerySchema },
  'API-M03-02': {
    query: z.object({
      keyword: searchKeywordSchema.min(2, 'Cần ít nhất 2 ký tự để gợi ý.'),
    }),
  },
  'API-M03-03': {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(20).default(10),
    }),
  },
  'API-M03-04': {
    query: z
      .object({
        date_from: isoDateSchema.optional(),
        date_to: isoDateSchema.optional(),
      })
      .superRefine((data, ctx) => {
        if (
          data.date_from &&
          data.date_to &&
          Date.parse(data.date_to) < Date.parse(data.date_from)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['date_to'],
            message: 'date_to phải sau hoặc bằng date_from.',
          });
        }
      }),
  },
});
