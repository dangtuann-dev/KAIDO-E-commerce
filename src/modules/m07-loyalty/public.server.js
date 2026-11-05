import 'server-only';
import * as loyaltyService from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M07 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

/** M07-F05 — hạng + số điểm khả dụng cho M05/M09. */
export async function getLoyaltySummary(userId) {
  const data = await loyaltyService.getMyPoints({ userId });
  return {
    user_id: userId,
    tier_code: data.current_tier,
    tier_label: data.tier_label,
    point_multiplier: data.point_multiplier,
    available_points: data.available_points,
    total_points: data.total_points,
    rolling_spend_12m: data.rolling_spend_12m,
    next_tier: data.next_tier,
    value_vnd: data.value_vnd,
  };
}

/** M07-F04 — kiểm tra bội số 10 và trần 50% hóa đơn. */
export async function calculatePointsDiscount(userId, points, subtotal) {
  return loyaltyService.calculatePointsDiscount(userId, points, subtotal);
}

/** M07-F03 — điểm vào khi đơn COMPLETED (idempotent). */
export async function awardPointsForOrder(orderId) {
  return loyaltyService.awardOrderPoints(orderId);
}

/** M07-F04 — trừ điểm ngay khi đơn được tạo (idempotent). */
export async function redeemPointsForOrder(orderId) {
  return loyaltyService.redeemOrderPoints(orderId);
}

/** M07-F04 — hoàn điểm khi đơn hủy/trả (idempotent). */
export async function refundPointsForOrder(orderId) {
  return loyaltyService.refundOrderPoints(orderId);
}
