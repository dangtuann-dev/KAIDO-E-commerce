import 'server-only';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { COUPON_SCOPE_VALUES, DISCOUNT_TYPE_VALUES } from '@/shared/constants/loyalty.js';

export const MODULE_CODE = 'TOY-M09';

export const BANNER_POSITIONS = Object.freeze({
  HOME_HERO: 'HOME_HERO',
  HOME_PROMO: 'HOME_PROMO',
  CATEGORY: 'CATEGORY',
  SIDEBAR: 'SIDEBAR',
});

export const BANNER_POSITION_VALUES = Object.freeze(Object.values(BANNER_POSITIONS));

/** Hero slider trang chủ — vị trí duy nhất bị giới hạn 5 banner (BR-M09-04). */
export const DEFAULT_BANNER_POSITION = BANNER_POSITIONS.HOME_HERO;

export const CONTENT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
});

export const CONTENT_STATUS_VALUES = Object.freeze(Object.values(CONTENT_STATUS));

/** Trạng thái bài viết là enum riêng trong schema (article_status). */
export const ARTICLE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
});

export const ARTICLE_STATUS_VALUES = Object.freeze(Object.values(ARTICLE_STATUS));

export const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
});

export const CAMPAIGN_STATUS_VALUES = Object.freeze(Object.values(CAMPAIGN_STATUS));

export const CAMPAIGN_TYPES = Object.freeze({
  FLASH_SALE: 'FLASH_SALE',
  EVENT: 'EVENT',
  SEASONAL: 'SEASONAL',
});

export const CAMPAIGN_TYPE_VALUES = Object.freeze(Object.values(CAMPAIGN_TYPES));

export const COUPON_TYPES = Object.freeze(DISCOUNT_TYPE_VALUES);
export const COUPON_SCOPES = Object.freeze(COUPON_SCOPE_VALUES);

export const MAX_HOME_HERO_BANNERS = BUSINESS_RULES.MARKETING.MAX_HOME_HERO_BANNERS;
export const VOUCHER_RATE_LIMIT_PER_MINUTE = BUSINESS_RULES.MARKETING.VOUCHER_RATE_LIMIT_PER_MINUTE;
export const MAX_BANNER_FILE_SIZE_MB = BUSINESS_RULES.MARKETING.MAX_BANNER_FILE_SIZE_MB;

/** Số SKU tối đa của một chiến dịch flash sale (giữ payload RPC/PostgREST gọn). */
export const MAX_CAMPAIGN_ITEMS = 50;

/** Kích thước trang blog công khai và bảng back-office. */
export const BLOG_PAGE_SIZE = 9;
export const ADMIN_PAGE_SIZE = 20;

/** Số voucher trưng bày trên trang khuyến mãi. */
export const PUBLIC_COUPON_LIMIT = 12;

/** Mặc định BR-M09-03: mỗi khách dùng một mã tối đa 1 lần nếu không cấu hình. */
export const DEFAULT_USAGE_LIMIT_PER_USER = 1;

/** Định dạng ảnh banner cho phép (BR: jpg/png/webp ≤ 2MB — M09-F01). */
export const BANNER_IMAGE_EXTENSIONS = Object.freeze(['jpg', 'jpeg', 'png', 'webp']);
