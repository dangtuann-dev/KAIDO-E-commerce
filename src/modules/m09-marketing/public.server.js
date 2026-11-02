import 'server-only';
import * as marketingService from './server/service.js';

/**
 * CouponService DUY NHẤT của hệ thống (OPEN_DECISIONS #9).
 * M04/M05/M07 bắt buộc gọi qua M09 public.server.js, không tự truy vấn coupons.
 */
export const CouponService = Object.freeze({
  /** M09-F08 — kiểm tra hiệu lực, min order, usage limit, phạm vi. */
  async verifyCoupon(input) {
    return marketingService.verifyCoupon(input);
  },
  /** M09-F08 — tiêu thụ coupon nguyên tử khi tạo đơn (BR-M07-05). */
  async consumeCoupon(input) {
    return marketingService.consumeCoupon(input);
  },
  /** M09-F08 — hoàn lượt dùng khi hủy đơn (BR-M09-05). */
  async releaseCoupon(input) {
    return marketingService.releaseCoupon(input);
  },
});

/** M09-F07 — banner đang hiệu lực cho storefront. */
export async function getBannerContent(position = null) {
  return marketingService.getBanners({ position });
}

/** M09-F07 — chiến dịch đang chạy. */
export async function getActiveCampaigns() {
  return marketingService.getActiveCampaigns();
}
