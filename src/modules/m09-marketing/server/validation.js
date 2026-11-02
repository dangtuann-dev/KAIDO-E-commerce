import 'server-only';
import { z } from 'zod';
import { COUPON_SCOPE_VALUES, DISCOUNT_TYPE_VALUES } from '@/shared/constants/loyalty.js';
import {
  isoDateSchema,
  paginationQuerySchema,
  searchKeywordSchema,
  uuidSchema,
  voucherCodeSchema,
} from '@/shared/validation/index.js';
import {
  ARTICLE_STATUS_VALUES,
  BANNER_POSITION_VALUES,
  CAMPAIGN_STATUS_VALUES,
  CAMPAIGN_TYPE_VALUES,
  CONTENT_STATUS_VALUES,
  MAX_CAMPAIGN_ITEMS,
  PUBLIC_COUPON_LIMIT,
} from './constants.js';

/** Zod schema theo API-M09-xx. Field dùng snake_case giống các module khác. */

const bannerPositionSchema = z
  .string()
  .trim()
  .transform((value) => (value.toLowerCase() === 'home_main' ? 'HOME_HERO' : value.toUpperCase()))
  .pipe(z.enum(BANNER_POSITION_VALUES));

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

const requiredUrlSchema = z.string().trim().url('URL ảnh không hợp lệ.');

/** Ảnh banner jpg/png/webp (M09-F01, BR-M09-04) — dung lượng kiểm tra ở form admin. */
const bannerImageUrlSchema = requiredUrlSchema.superRefine((value, ctx) => {
  const path = value.split('?')[0].toLowerCase();
  if (!/\.(jpe?g|png|webp)$/.test(path)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Ảnh banner phải là jpg, png hoặc webp.',
    });
  }
});

const idParamsSchema = z.object({ id: uuidSchema });

const atLeastOneField = (data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cần cung cấp ít nhất một trường để cập nhật.',
    });
  }
};

const validWindow = (start, end, ctx, endPath = 'end_time') => {
  if (start && end && Date.parse(end) <= Date.parse(start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [endPath],
      message: 'end_time phải sau start_time.',
    });
  }
};

/* ------------------------------------------------------------------ */
/* Banner (M09-F01, M09-F05)                                           */
/* ------------------------------------------------------------------ */

const bannerFields = {
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề tối thiểu 3 ký tự.')
    .max(150, 'Tiêu đề tối đa 150 ký tự.'),
  image_url: bannerImageUrlSchema,
  mobile_image_url: optionalUrlSchema,
  target_url: optionalUrlSchema,
  position: bannerPositionSchema,
  start_time: isoDateSchema.optional().nullable(),
  end_time: isoDateSchema.optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(9999).optional(),
  status: z.enum(CONTENT_STATUS_VALUES),
  is_active: z.boolean().optional(),
};

const createBannerBodySchema = z
  .object({
    ...bannerFields,
    position: bannerFields.position.default('HOME_HERO'),
    status: bannerFields.status.default('DRAFT'),
  })
  .superRefine((data, ctx) => validWindow(data.start_time, data.end_time, ctx));

const updateBannerBodySchema = z
  .object({
    ...bannerFields,
    status: bannerFields.status.optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    atLeastOneField(data, ctx);
    validWindow(data.start_time, data.end_time, ctx);
  });

const listBannersQuerySchema = z.object({
  position: bannerPositionSchema.optional(),
  status: z.enum(CONTENT_STATUS_VALUES).optional(),
  keyword: searchKeywordSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/* ------------------------------------------------------------------ */
/* Bài viết (M09-F02)                                                  */
/* ------------------------------------------------------------------ */

const articleFields = {
  title: z
    .string()
    .trim()
    .min(5, 'Tiêu đề tối thiểu 5 ký tự.')
    .max(200, 'Tiêu đề tối đa 200 ký tự.'),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(500, 'Mô tả ngắn tối đa 500 ký tự.').optional().nullable(),
  content: z.string().trim().min(20, 'Nội dung tối thiểu 20 ký tự.').max(50000),
  cover_image_url: optionalUrlSchema,
  category_id: uuidSchema.nullable().optional(),
  status: z.enum(ARTICLE_STATUS_VALUES),
  /** M09-F05 — DRAFT + published_at trong tương lai = hẹn giờ xuất bản bằng cron. */
  published_at: isoDateSchema.optional().nullable(),
  meta_title: z.string().trim().max(70, 'Meta title tối đa 70 ký tự.').optional().nullable(),
  meta_description: z
    .string()
    .trim()
    .max(160, 'Meta description tối đa 160 ký tự.')
    .optional()
    .nullable(),
};

const createArticleBodySchema = z.object({
  ...articleFields,
  status: articleFields.status.default('DRAFT'),
});

const updateArticleBodySchema = z
  .object({
    ...articleFields,
    status: articleFields.status.optional(),
  })
  .partial()
  .superRefine(atLeastOneField);

const listArticlesQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().max(120).optional(),
});

const listAdminArticlesQuerySchema = z.object({
  status: z.enum(ARTICLE_STATUS_VALUES).optional(),
  category: z.string().trim().max(120).optional(),
  keyword: searchKeywordSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const articleSlugParamsSchema = z.object({
  slug: z.string().trim().min(1, 'Slug bài viết là bắt buộc.').max(220),
});

/* ------------------------------------------------------------------ */
/* Chiến dịch (M09-F03, M09-F05)                                       */
/* ------------------------------------------------------------------ */

const campaignItemSchema = z.object({
  product_id: uuidSchema,
  variant_id: uuidSchema.nullable().optional(),
  sale_price: z.coerce.number().int('Giá flash sale phải là số nguyên VND.').positive(),
  quantity_limit: z.coerce.number().int().positive().max(100000).nullable().optional(),
});

const campaignFields = {
  name: z.string().trim().min(3, 'Tên chiến dịch tối thiểu 3 ký tự.').max(150),
  slug: slugSchema.optional(),
  campaign_type: z.enum(CAMPAIGN_TYPE_VALUES),
  description: z.string().trim().max(1000).optional().nullable(),
  starts_at: isoDateSchema,
  ends_at: isoDateSchema,
  banner_id: uuidSchema.nullable().optional(),
  items: z.array(campaignItemSchema).max(MAX_CAMPAIGN_ITEMS).optional(),
};

const createCampaignBodySchema = z
  .object({ ...campaignFields, campaign_type: campaignFields.campaign_type.default('FLASH_SALE') })
  .superRefine((data, ctx) => {
    validWindow(data.starts_at, data.ends_at, ctx, 'ends_at');
  });

const updateCampaignBodySchema = z
  .object({
    ...campaignFields,
    starts_at: isoDateSchema.optional(),
    ends_at: isoDateSchema.optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    atLeastOneField(data, ctx);
    validWindow(data.starts_at, data.ends_at, ctx, 'ends_at');
  });

const listCampaignsQuerySchema = z.object({
  status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
  type: z.enum(CAMPAIGN_TYPE_VALUES).optional(),
  keyword: searchKeywordSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** M09-F05 — đổi trạng thái chiến dịch theo hành động nghiệp vụ. */
const changeCampaignStatusBodySchema = z.object({
  action: z.enum(['SCHEDULE', 'ACTIVATE', 'END', 'CANCEL', 'DRAFT'], {
    required_error: 'Vui lòng chọn hành động.',
  }),
});

/* ------------------------------------------------------------------ */
/* Coupon (M09-F04, M09-F08)                                           */
/* ------------------------------------------------------------------ */

const couponFields = {
  code: voucherCodeSchema,
  name: z.string().trim().min(3, 'Tên chương trình tối thiểu 3 ký tự.').max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  type: z.enum(DISCOUNT_TYPE_VALUES),
  value: z.coerce.number().int().min(0),
  max_discount: z.coerce.number().int().min(0).nullable().optional(),
  min_order: z.coerce.number().int().min(0).default(0),
  /** BR-M09-01 — phạm vi áp dụng; PRODUCT/CATEGORY cần danh sách id trong applicable_targets. */
  scope: z.enum(COUPON_SCOPE_VALUES).default('ALL'),
  applicable_targets: z.array(z.string().trim().min(1)).max(100).optional(),
  usage_limit: z.coerce.number().int().positive().nullable().optional(),
  usage_limit_per_user: z.coerce.number().int().positive().nullable().optional(),
  start_time: isoDateSchema,
  end_time: isoDateSchema,
};

const createCouponBodySchema = z.object(couponFields).superRefine((data, ctx) => {
  validWindow(data.start_time, data.end_time, ctx);
  if (data.type === 'PERCENT' && !(data.value >= 1 && data.value <= 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Coupon PERCENT phải có giá trị 1–100.',
    });
  }
  if (data.type === 'FIXED' && data.value <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Coupon FIXED phải có giá trị lớn hơn 0.',
    });
  }
  if (data.max_discount != null && data.type !== 'PERCENT') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['max_discount'],
      message: 'Chỉ coupon PERCENT mới có mức giảm tối đa.',
    });
  }
  if (
    ['PRODUCT', 'CATEGORY'].includes(data.scope) &&
    (data.applicable_targets ?? []).length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['applicable_targets'],
      message: 'Coupon theo phạm vi sản phẩm/danh mục phải chọn ít nhất một đối tượng.',
    });
  }
});

const updateCouponBodySchema = z
  .object({
    name: couponFields.name,
    description: couponFields.description,
    value: z.coerce.number().int().min(0).optional(),
    max_discount: couponFields.max_discount,
    min_order: z.coerce.number().int().min(0).optional(),
    usage_limit: couponFields.usage_limit,
    usage_limit_per_user: couponFields.usage_limit_per_user,
    end_time: isoDateSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .partial()
  .superRefine(atLeastOneField);

const listCouponsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'UPCOMING']).optional(),
  keyword: searchKeywordSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const publicCouponsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(PUBLIC_COUPON_LIMIT),
});

/** API-M09-03 — dùng chung cho M04/M05/M07 (CouponService). */
const verifyCouponBodySchema = z.object({
  code: voucherCodeSchema,
  order_amount: z.coerce.number().int().min(0),
  customer_id: uuidSchema.optional(),
  items: z
    .array(
      z.object({
        product_id: uuidSchema.optional(),
        category_id: uuidSchema.nullable().optional(),
        variant_id: uuidSchema.nullable().optional(),
        sku: z.string().trim().max(64).optional(),
        quantity: z.coerce.number().int().positive(),
        unit_price: z.coerce.number().int().min(0).optional(),
        line_total: z.coerce.number().int().min(0).optional(),
      }),
    )
    .max(100)
    .optional(),
});

export const validationSchemas = Object.freeze({
  'API-M09-01': {
    query: z.object({
      position: bannerPositionSchema.optional(),
    }),
  },
  'API-M09-02': {},
  'API-M09-03': { body: verifyCouponBodySchema },
  'API-M09-04': { body: createBannerBodySchema },
  'API-M09-05': { body: createCouponBodySchema },
  'API-M09-06': { query: listArticlesQuerySchema },
  'API-M09-07': { params: articleSlugParamsSchema },
  'API-M09-08': { query: publicCouponsQuerySchema },
  'API-M09-09': { query: listBannersQuerySchema },
  'API-M09-10': { params: idParamsSchema, body: updateBannerBodySchema },
  'API-M09-11': { params: idParamsSchema },
  'API-M09-12': { query: listAdminArticlesQuerySchema },
  'API-M09-13': { body: createArticleBodySchema },
  'API-M09-14': { params: idParamsSchema, body: updateArticleBodySchema },
  'API-M09-15': { params: idParamsSchema },
  'API-M09-16': { query: listCampaignsQuerySchema },
  'API-M09-17': { body: createCampaignBodySchema },
  'API-M09-18': { params: idParamsSchema },
  'API-M09-19': { params: idParamsSchema, body: updateCampaignBodySchema },
  'API-M09-20': { params: idParamsSchema, body: changeCampaignStatusBodySchema },
  'API-M09-21': { query: listCouponsQuerySchema },
  'API-M09-22': { params: idParamsSchema, body: updateCouponBodySchema },
  'API-M09-23': { params: idParamsSchema },
  'API-M09-24': { params: idParamsSchema },
});
