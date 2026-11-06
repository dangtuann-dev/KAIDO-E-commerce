import 'server-only';
import {
  assertVerifiedPurchase as findVerifiedPurchase,
  closeResolvedTickets as closeSupportTickets,
  getProductRatingSummary as readRatingSummary,
} from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M10 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

/**
 * M10-F03 — Rating trung bình/số lượt cho M02/storefront.
 * @param {string} productId
 * @returns {Promise<{product_id: string, rating_avg: number, rating_count: number, rating_breakdown: Record<string, number>}>}
 */
export async function getProductRatingSummary(productId) {
  const summary = await readRatingSummary(productId);
  return {
    product_id: summary.product_id,
    rating_avg: summary.rating_avg,
    rating_count: summary.rating_count,
    rating_breakdown: summary.rating_breakdown,
  };
}

/**
 * M10-F01 — Kiểm tra quyền đánh giá từ đơn đã COMPLETED (Verified Purchase).
 * @param {{userId: string, orderRef: string, productId: string}} input
 * @returns {Promise<{order_id: string, order_item_id: string, order_code: string} | null>}
 */
export async function assertVerifiedPurchase({ userId, orderRef, productId }) {
  if (!userId || !orderRef || !productId) return null;
  return findVerifiedPurchase({ userId, orderRef, productId });
}

/**
 * M10-F08 — Điểm vào cron close-support-tickets (BR-M10-04).
 * @param {{hours?: number}} [options]
 * @returns {Promise<{closed_count: number, threshold_hours: number, ran_at: string, mode: string}>}
 */
export async function closeResolvedTickets(options = {}) {
  return closeSupportTickets(options);
}
