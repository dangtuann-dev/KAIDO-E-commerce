/**
 * [SHARED] Khuyến mãi, voucher, điểm thưởng — SRS M07, M09
 * Chỉ có MỘT CouponService dùng chung (đặt tại M09); M07 gọi qua public.server.js.
 */
export const DISCOUNT_TYPES = Object.freeze({
  FIXED: 'FIXED',
  PERCENT: 'PERCENT',
  FREESHIP: 'FREESHIP',
});

export const DISCOUNT_TYPE_VALUES = Object.freeze(Object.values(DISCOUNT_TYPES));

export const DISCOUNT_TYPE_LABELS = Object.freeze({
  FIXED: 'Giảm số tiền cố định',
  PERCENT: 'Giảm theo phần trăm',
  FREESHIP: 'Miễn phí vận chuyển',
});

export const MEMBERSHIP_TIERS = Object.freeze({
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  DIAMOND: 'DIAMOND',
});

export const MEMBERSHIP_TIER_VALUES = Object.freeze(Object.values(MEMBERSHIP_TIERS));

export const MEMBERSHIP_TIER_LABELS = Object.freeze({
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  DIAMOND: 'Kim cương',
});

/** M07-F05 / BR-M07-04 — xét theo chi tiêu 12 tháng gần nhất. */
export const MEMBERSHIP_TIER_RULES = Object.freeze({
  BRONZE: { minSpent: 0, maxSpent: 2000000, pointMultiplier: 1 },
  SILVER: { minSpent: 2000000, maxSpent: 5000000, pointMultiplier: 1.2 },
  GOLD: { minSpent: 5000000, maxSpent: 15000000, pointMultiplier: 1.5 },
  DIAMOND: { minSpent: 15000000, maxSpent: null, pointMultiplier: 2 },
});

export const LOYALTY_TRANSACTION_TYPES = Object.freeze({
  EARN: 'EARN',
  REDEEM: 'REDEEM',
  REFUND: 'REFUND',
  EXPIRE: 'EXPIRE',
  ADJUST: 'ADJUST',
});

export const LOYALTY_TRANSACTION_TYPE_VALUES = Object.freeze(
  Object.values(LOYALTY_TRANSACTION_TYPES),
);

export const COUPON_SCOPES = Object.freeze({
  ALL: 'ALL',
  CATEGORY: 'CATEGORY',
  PRODUCT: 'PRODUCT',
  SHIPPING: 'SHIPPING',
});

export const COUPON_SCOPE_VALUES = Object.freeze(Object.values(COUPON_SCOPES));
