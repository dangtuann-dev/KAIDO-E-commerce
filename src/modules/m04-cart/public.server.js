import 'server-only';
import {
  clearCartAfterOrder as clearCartAfterOrderService,
  getCartSummaryForCheckout as getCartSummaryForCheckoutService,
  mergeGuestCartIntoUser as mergeGuestCartIntoUserService,
} from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M04 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

/**
 * M04-F06 — Tóm tắt giỏ theo đúng các dòng M05 sắp đặt hàng.
 * Trả `items: []` khi người dùng chưa có giỏ ACTIVE.
 * @param {string} userId
 * @param {string[]} itemIds
 */
export async function getCartSummaryForCheckout(userId, itemIds) {
  return getCartSummaryForCheckoutService(userId, itemIds);
}

/**
 * M04-F05 — Chốt giỏ sau khi đặt hàng thành công (M05 gọi sau khi tạo đơn).
 * Chỉ xóa các dòng đã đặt; giỏ chuyển CONVERTED khi không còn dòng nào.
 * @param {string} cartId
 * @param {{ item_id: string, quantity: number }[]} orderedItems
 */
export async function clearCartAfterOrder(cartId, orderedItems = []) {
  return clearCartAfterOrderService(cartId, orderedItems);
}

/**
 * M04-F08 — Gộp giỏ khách vãng lai vào giỏ thành viên ngay sau khi đăng nhập (M01).
 * @param {string} userId
 * @param {string} guestSessionId
 */
export async function mergeGuestCartIntoUser(userId, guestSessionId) {
  return mergeGuestCartIntoUserService(userId, guestSessionId);
}
