import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M04-F02) — Tìm/tạo giỏ theo user hoặc guest session, tính lại giá và tồn.
 */
export async function getCart() {
  throw new NotImplementedError('M04-F02');
}

/**
 * TODO(M04-F01) — Kiểm tra current + new <= available, tối đa 20/SKU (BR-M04-01, BR-M04-05).
 */
export async function addCartItem() {
  throw new NotImplementedError('M04-F01');
}

/**
 * TODO(M04-F03) — Cập nhật số lượng, quantity = 0 thì xóa dòng (BR-M04-06).
 */
export async function updateCartItem() {
  throw new NotImplementedError('M04-F03');
}

/**
 * TODO(M04-F04) — Xóa một dòng; UI hỗ trợ Undo 5 giây.
 */
export async function removeCartItem() {
  throw new NotImplementedError('M04-F04');
}

/**
 * TODO(M04-F04) — Xóa nhiều dòng đã chọn.
 */
export async function bulkRemoveCartItems() {
  throw new NotImplementedError('M04-F04');
}

/**
 * TODO(M04-F05) — Xóa toàn bộ dòng của giỏ hiện tại.
 */
export async function clearCart() {
  throw new NotImplementedError('M04-F05');
}

/**
 * TODO(M04-F06) — Xác thực danh sách item thuộc giỏ trước khi chuyển checkout.
 */
export async function selectItemsForCheckout() {
  throw new NotImplementedError('M04-F06');
}

/**
 * TODO(M04-F07) — Ủy quyền xác thực coupon cho CouponService M09 (OPEN_DECISIONS #9).
 */
export async function applyCouponToCart() {
  throw new NotImplementedError('M04-F07');
}

/**
 * TODO(M04-F08) — Gộp giỏ guest vào member, cộng dồn SKU nhưng không vượt tồn.
 */
export async function mergeGuestCart() {
  throw new NotImplementedError('M04-F08');
}

/**
 * TODO(M04-F09) — Phát hiện giá/tồn thay đổi và trả cảnh báo.
 */
export async function revalidateCart() {
  throw new NotImplementedError('M04-F09');
}

/**
 * TODO(M04-F10) — Chuyển dòng giỏ sang cart_saved_items.
 */
export async function saveForLater() {
  throw new NotImplementedError('M04-F10');
}

/**
 * TODO(M04-F10) — Khôi phục món đã lưu nếu còn đủ tồn.
 */
export async function restoreSavedItem() {
  throw new NotImplementedError('M04-F10');
}
