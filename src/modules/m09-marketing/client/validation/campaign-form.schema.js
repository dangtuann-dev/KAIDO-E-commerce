/**
 * [TOY-M09] Schema form chiến dịch phía client — phản chiếu server/validation.js.
 * Server là nguồn sự thật; file này không import server-only nên dùng được trong Client Component.
 * Quy tắc: M09-F03, M09-F05, BR-M09-01.
 */
import { z } from 'zod';

export const CAMPAIGN_TYPE_OPTIONS = Object.freeze(['FLASH_SALE', 'EVENT', 'SEASONAL']);

export const MAX_CAMPAIGN_ITEMS = 50;

const campaignItemSchema = z.object({
  product_id: z.string().uuid('Vui lòng chọn sản phẩm cho dòng flash sale.'),
  // Giữ nguyên biến thể đã gán trước đó: trình chọn SKU ở cấp sản phẩm không đổi được biến thể.
  variant_id: z.string().uuid().nullable().optional(),
  product_name: z.string().optional(),
  price_regular: z.coerce.number().optional(),
  sale_price: z.coerce
    .number({ invalid_type_error: 'Giá flash sale phải là số.' })
    .int('Giá flash sale phải là số nguyên VND.')
    .positive('Giá flash sale phải lớn hơn 0.'),
  quantity_limit: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (/^\d+$/.test(value) && Number(value) > 0),
      'Giới hạn số lượng phải là số nguyên dương.',
    ),
});

export const campaignFormSchema = z
  .object({
    name: z
      .string({ required_error: 'Tên chiến dịch là bắt buộc.' })
      .trim()
      .min(3, 'Tên chiến dịch tối thiểu 3 ký tự.')
      .max(150, 'Tên chiến dịch tối đa 150 ký tự.'),
    campaign_type: z.enum(CAMPAIGN_TYPE_OPTIONS),
    description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự.').optional(),
    starts_at: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu.'),
    ends_at: z.string().min(1, 'Vui lòng chọn thời gian kết thúc.'),
    banner_id: z.string().optional(),
    items: z.array(campaignItemSchema).max(MAX_CAMPAIGN_ITEMS, 'Tối đa 50 SKU mỗi chiến dịch.'),
  })
  .superRefine((data, ctx) => {
    const startsAt = Date.parse(data.starts_at);
    const endsAt = Date.parse(data.ends_at);
    if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ends_at'],
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }

    const seen = new Set();
    (data.items ?? []).forEach((item, index) => {
      if (seen.has(item.product_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'product_id'],
          message: 'Sản phẩm này đã có trong chiến dịch.',
        });
      }
      seen.add(item.product_id);

      const regular = Number(item.price_regular);
      if (Number.isFinite(regular) && regular > 0 && Number(item.sale_price) >= regular) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'sale_price'],
          message: 'Giá flash sale phải thấp hơn giá niêm yết.',
        });
      }
    });
  });

export const EMPTY_CAMPAIGN_FORM = Object.freeze({
  name: '',
  campaign_type: 'FLASH_SALE',
  description: '',
  starts_at: '',
  ends_at: '',
  banner_id: '',
  items: [],
});
