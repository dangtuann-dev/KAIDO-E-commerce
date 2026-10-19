import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M07-F01) — Ủy quyền CouponService M09 tạo voucher.
 */
export async function createVoucher() {
  throw new NotImplementedError('M07-F01');
}

/**
 * TODO(M07-F02) — Ủy quyền CouponService, trả is_valid/discount_amount trong < 200ms.
 */
export async function validateVoucher() {
  throw new NotImplementedError('M07-F02');
}

/**
 * TODO(M07-F03) — Cộng điểm khi đơn COMPLETED, áp point multiplier theo hạng (BR-M07-01).
 */
export async function awardOrderPoints() {
  throw new NotImplementedError('M07-F03');
}

/**
 * TODO(M07-F04) — Trừ điểm ngay khi đặt; tối đa 50% hóa đơn, bội số 10 (BR-M07-02, BR-M07-03).
 */
export async function redeemPoints() {
  throw new NotImplementedError('M07-F04');
}

/**
 * TODO(M07-F04) — Hoàn 100% điểm khi đơn bị hủy (BR-M07-02).
 */
export async function refundOrderPoints() {
  throw new NotImplementedError('M07-F04');
}

/**
 * TODO(M07-F05) — Xét hạng theo rolling spend 12 tháng (BR-M07-04).
 */
export async function evaluateMembershipTier() {
  throw new NotImplementedError('M07-F05');
}

/**
 * TODO(M07-F06) — Hệ số tích điểm, giảm giá hạng và voucher sinh nhật (M07-F06).
 */
export async function applyTierBenefits() {
  throw new NotImplementedError('M07-F06');
}

/**
 * TODO(M07-F06) — Cron tháng sinh nhật tặng voucher 100k/200k.
 */
export async function issueBirthdayVouchers() {
  throw new NotImplementedError('M07-F06');
}

/**
 * TODO(M07-F07) — Lịch sử điểm + ngày hết hạn.
 */
export async function getPointHistory() {
  throw new NotImplementedError('M07-F07');
}

/**
 * TODO(M07-F03) — Số điểm, hạng, điểm sắp hết hạn, giá trị VND.
 */
export async function getMyPoints() {
  throw new NotImplementedError('M07-F03');
}
