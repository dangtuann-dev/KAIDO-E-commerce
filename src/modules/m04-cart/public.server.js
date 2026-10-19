import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M04 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M04-F06 — Snapshot giỏ đã xác thực cho M05 tạo đơn.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getCartSummaryForCheckout(_userId, _itemIds) {
  throw new NotImplementedError('M04-F06');
}

/**
 * M04-F05 — Xóa giỏ sau khi đặt hàng thành công.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function clearCartAfterOrder(_cartId) {
  throw new NotImplementedError('M04-F05');
}

/**
 * M04-F08 — Gộp giỏ sau đăng nhập.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function mergeGuestCartIntoUser(_userId, _guestSessionId) {
  throw new NotImplementedError('M04-F08');
}
