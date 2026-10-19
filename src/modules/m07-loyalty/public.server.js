import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M07 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M07-F05 — Hạng + số điểm khả dụng cho M05/M09.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getLoyaltySummary(_userId) {
  throw new NotImplementedError('M07-F05');
}

/**
 * M07-F04 — Kiểm tra bội số 10 và trần 50% hóa đơn.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function calculatePointsDiscount(_userId, _points, _subtotal) {
  throw new NotImplementedError('M07-F04');
}

/**
 * M07-F03 — Điểm vào khi đơn COMPLETED.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function awardPointsForOrder(_orderId) {
  throw new NotImplementedError('M07-F03');
}

/**
 * M07-F04 — Hoàn điểm khi đơn hủy/trả.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function refundPointsForOrder(_orderId) {
  throw new NotImplementedError('M07-F04');
}
