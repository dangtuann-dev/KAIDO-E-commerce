import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * CouponService DUY NHẤT của hệ thống (OPEN_DECISIONS #9).
 * M04/M05/M07 bắt buộc gọi qua M09 public.server.js, không tự truy vấn coupons.
 */
export const CouponService = Object.freeze({
  /** M09-F08 — kiểm tra hiệu lực, min order, usage limit, phạm vi. */
  async verifyCoupon(_input) {
    throw new NotImplementedError('M09-F08');
  },
  /** M09-F08 — tiêu thụ coupon nguyên tử khi tạo đơn (BR-M07-05). */
  async consumeCoupon(_input) {
    throw new NotImplementedError('M09-F08');
  },
  /** M09-F08 — hoàn lượt dùng khi hủy đơn (BR-M09-05). */
  async releaseCoupon(_input) {
    throw new NotImplementedError('M09-F08');
  },
});

/** M09-F07 — banner đang hiệu lực cho storefront. */
export async function getBannerContent(_position) {
  throw new NotImplementedError('M09-F07');
}

/** M09-F07 — chiến dịch đang chạy. */
export async function getActiveCampaigns() {
  throw new NotImplementedError('M09-F07');
}
