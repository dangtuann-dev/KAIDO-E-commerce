import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M09-F01) — Tạo banner responsive, tối đa 5 HOME_HERO (BR-M09-04).
 */
export async function createBanner() {
  throw new NotImplementedError('M09-F01');
}

/**
 * TODO(M09-F01) — Sửa/sắp xếp/bật tắt banner.
 */
export async function updateBanner() {
  throw new NotImplementedError('M09-F01');
}

/**
 * TODO(M09-F02) — Bài viết WYSIWYG, slug SEO, OpenGraph.
 */
export async function createArticle() {
  throw new NotImplementedError('M09-F02');
}

/**
 * TODO(M09-F02) — Biên tập/xuất bản bài viết.
 */
export async function updateArticle() {
  throw new NotImplementedError('M09-F02');
}

/**
 * TODO(M09-F03) — Tạo chiến dịch nhóm voucher/banner/SKU.
 */
export async function createCampaign() {
  throw new NotImplementedError('M09-F03');
}

/**
 * TODO(M09-F04) — Tạo coupon qua CouponService.
 */
export async function createCoupon() {
  throw new NotImplementedError('M09-F04');
}

/**
 * TODO(M09-F05) — Cron bật/tắt nội dung theo start/end time.
 */
export async function activateScheduledContent() {
  throw new NotImplementedError('M09-F05');
}

/**
 * TODO(M09-F06) — Phân trang/lọc banner, bài viết, chiến dịch.
 */
export async function listMarketingContent() {
  throw new NotImplementedError('M09-F06');
}

/**
 * TODO(M09-F07) — Banner đang hiệu lực theo position/display_order.
 */
export async function getBanners() {
  throw new NotImplementedError('M09-F07');
}

/**
 * TODO(M09-F07) — Chiến dịch trong khoảng hiệu lực.
 */
export async function getActiveCampaigns() {
  throw new NotImplementedError('M09-F07');
}

/**
 * TODO(M09-F08) — CouponService: kiểm tra thời gian, min order, usage limit, phạm vi (BR-M09-01, BR-M09-02).
 */
export async function verifyCoupon() {
  throw new NotImplementedError('M09-F08');
}

/**
 * TODO(M09-F08) — Tăng used_count nguyên tử khi đơn được tạo (BR-M07-05).
 */
export async function consumeCoupon() {
  throw new NotImplementedError('M09-F08');
}

/**
 * TODO(M09-F08) — Hoàn lượt dùng khi hủy đơn hợp lệ (BR-M09-05).
 */
export async function releaseCoupon() {
  throw new NotImplementedError('M09-F08');
}
