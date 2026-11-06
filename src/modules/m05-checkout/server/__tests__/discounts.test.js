import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/m09-marketing/public.server.js', () => ({
  CouponService: {
    verifyCoupon: vi.fn(),
    consumeCoupon: vi.fn(),
    releaseCoupon: vi.fn(),
  },
}));

vi.mock('@/modules/m07-loyalty/public.server.js', () => ({
  calculatePointsDiscount: vi.fn(),
  redeemPointsForOrder: vi.fn(),
  refundPointsForOrder: vi.fn(),
  awardPointsForOrder: vi.fn(),
}));

vi.mock('@/modules/m08-inventory/public.server.js', () => ({
  checkAvailability: vi.fn(),
  releaseForOrder: vi.fn(),
  reserveForOrder: vi.fn(),
}));

vi.mock('@/modules/m04-cart/public.server.js', () => ({
  clearCartAfterOrder: vi.fn(),
  getCartSummaryForCheckout: vi.fn(),
}));

const { CouponService } = await import('@/modules/m09-marketing/public.server.js');
const { calculatePointsDiscount } = await import('@/modules/m07-loyalty/public.server.js');
const { applyOrderDiscounts } = await import('../service.js');

const LINES = [{ product_id: 'p1', variant_id: 'v1', quantity: 2, line_total: 400000 }];

describe('M05 × M09 — áp mã giảm giá qua CouponService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculatePointsDiscount.mockResolvedValue({ discount_amount: 0, available_points: 0 });
  });

  it('giữ nguyên metadata coupon do M09 trả về', async () => {
    CouponService.verifyCoupon.mockResolvedValue({
      is_valid: true,
      discount_amount: 40000,
      freeship: false,
      message: 'Đã áp dụng mã WELCOME10.',
      coupon: {
        coupon_id: 'coupon-1',
        id: 'coupon-1',
        code: 'WELCOME10',
        name: 'Chào khách mới',
        discount_type: 'PERCENT',
        discount_value: 10,
        max_discount_amount: 50000,
        min_order_amount: 100000,
      },
    });

    const result = await applyOrderDiscounts({
      userId: 'user-1',
      couponCode: 'WELCOME10',
      subtotal: 400000,
      lines: LINES,
    });

    expect(result.discountAmount).toBe(40000);
    expect(result.freeship).toBe(false);
    expect(result.coupon).toMatchObject({
      coupon_id: 'coupon-1',
      code: 'WELCOME10',
      valid: true,
      name: 'Chào khách mới',
      discount_type: 'PERCENT',
      discount_amount: 40000,
    });
  });

  it('giảm không vượt quá tạm tính', async () => {
    CouponService.verifyCoupon.mockResolvedValue({
      discount_amount: 999999,
      freeship: false,
      coupon: { coupon_id: 'coupon-2', code: 'BIG', discount_type: 'FIXED' },
    });

    const result = await applyOrderDiscounts({
      userId: 'user-1',
      couponCode: 'BIG',
      subtotal: 150000,
      lines: LINES,
    });

    expect(result.discountAmount).toBe(150000);
  });

  it('coupon FREESHIP trả cờ freeship và không giảm tiền hàng', async () => {
    CouponService.verifyCoupon.mockResolvedValue({
      is_valid: true,
      discount_amount: 0,
      freeship: true,
      message: 'Mã miễn phí vận chuyển hợp lệ.',
      coupon: {
        coupon_id: 'coupon-3',
        code: 'FREESHIP',
        name: 'Miễn phí giao hàng',
        discount_type: 'FREESHIP',
      },
    });

    const result = await applyOrderDiscounts({
      userId: 'user-1',
      couponCode: 'FREESHIP',
      subtotal: 200000,
      lines: LINES,
    });

    expect(result.freeship).toBe(true);
    expect(result.discountAmount).toBe(0);
    expect(result.coupon.code).toBe('FREESHIP');
  });
});

describe('M05 × M07 — điểm tiêu dùng đúng số M07 cắt theo trần', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không ghi nhận vượt quá số điểm M07 thực trừ', async () => {
    calculatePointsDiscount.mockResolvedValue({
      points_used: 200,
      discount_amount: 200000,
      available_points: 5000,
      max_redeemable_points: 200,
    });

    const result = await applyOrderDiscounts({
      userId: 'user-1',
      pointsRedeemed: 5000,
      subtotal: 400000,
      lines: LINES,
    });

    expect(result.pointsUsed).toBe(200);
    expect(result.pointsDiscountAmount).toBe(200000);
  });
});
