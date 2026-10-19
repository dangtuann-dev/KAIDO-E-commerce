import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M10 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M10-F03 — Rating trung bình/số lượt cho M02/storefront.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getProductRatingSummary(_productId) {
  throw new NotImplementedError('M10-F03');
}

/**
 * M10-F01 — Kiểm tra quyền đánh giá từ đơn COMPLETED.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function assertVerifiedPurchase(_userId, _orderItemId) {
  throw new NotImplementedError('M10-F01');
}

/**
 * M10-F08 — Điểm vào cron close-support-tickets.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function closeResolvedTickets() {
  throw new NotImplementedError('M10-F08');
}
