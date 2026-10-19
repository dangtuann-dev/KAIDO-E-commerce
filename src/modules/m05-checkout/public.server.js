import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M05 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M05-F10 — Đơn hàng cho M06/M10 theo mã hoặc id.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getOrderByRef(_orderRef) {
  throw new NotImplementedError('M05-F10');
}

/**
 * M05-F10 — Trạng thái hiện tại cho timeline.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getOrderStatus(_orderRef) {
  throw new NotImplementedError('M05-F10');
}

/**
 * M05-F10 — Kiểm tra quyền truy cập đơn (NFR-M10-02).
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function isOrderOwnedByUser(_orderRef, _userId) {
  throw new NotImplementedError('M05-F10');
}

/**
 * M05-F07 — Cập nhật thanh toán idempotent từ IPN/webhook.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function recordPaymentResult(_payload) {
  throw new NotImplementedError('M05-F07');
}
