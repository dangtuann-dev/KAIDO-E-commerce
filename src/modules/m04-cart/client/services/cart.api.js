/**
 * [TOY-M04] Client services — Giỏ hàng
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: đã nối backend (TOY-M04) — guest cart dùng X-Guest-Session-Id do http client tự gắn.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M04-01 — Xem giỏ hàng
 * Giỏ của khách (X-Guest-Session-Id) hoặc thành viên; kiểm tra tồn/giá (BR-M04-02, F09).
 * GET /api/v1/cart · quyền: công khai hoặc đăng nhập
 * Input: Header Authorization (tùy chọn) hoặc X-Guest-Session-Id
 * Output: { cart_id, items: [...], total_items, selected_subtotal, total_discount, estimated_total }
 */
export function getCart({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M04-01');
  return api.get(endpoint.path, { query });
}

/**
 * API-M04-02 — Thêm sản phẩm vào giỏ
 * Kiểm tra N + current_qty <= available_stock; tối đa 20 đơn vị/SKU (BR-M04-01, 05).
 * POST /api/v1/cart/items · quyền: công khai hoặc đăng nhập
 * Input: { product_id, variant_id, quantity }
 * Output: { success: true, cart_summary: {...} }
 */
export function addCartItem({ body } = {}) {
  const endpoint = getApiEndpoint('API-M04-02');
  return api.post(endpoint.path, body);
}

/**
 * API-M04-03 — Cập nhật số lượng
 * Cập nhật số lượng, kiểm tra tồn khả dụng; xóa khi giảm về 0 (BR-M04-06).
 * PUT /api/v1/cart/items/[itemId] · quyền: công khai hoặc đăng nhập
 * Input: { quantity }
 * Output: { item_id, quantity, line_total, cart_subtotal }
 */
export function updateCartItem({ itemId, body } = {}) {
  const endpoint = getApiEndpoint('API-M04-03');
  return api.put(resolveEndpointPath(endpoint.path, { itemId }), body);
}

/**
 * API-M04-04 — Xóa sản phẩm khỏi giỏ
 * Xóa một dòng; UI hỗ trợ Undo 5 giây (M04-F04).
 * DELETE /api/v1/cart/items/[itemId] · quyền: công khai hoặc đăng nhập
 * Input: item_id
 * Output: { success: true, message: 'Đã xóa sản phẩm' }
 */
export function removeCartItem({ itemId } = {}) {
  const endpoint = getApiEndpoint('API-M04-04');
  return api.delete(resolveEndpointPath(endpoint.path, { itemId }));
}

/**
 * API-M04-05 — Xóa nhiều sản phẩm
 * Xóa nhiều dòng đã chọn (M04-F04).
 * POST /api/v1/cart/items/bulk-delete · quyền: công khai hoặc đăng nhập
 * Input: { item_ids: [...] }
 * Output: { success: true, removed_count }
 */
export function bulkRemoveCartItems({ body } = {}) {
  const endpoint = getApiEndpoint('API-M04-05');
  return api.post(endpoint.path, body);
}

/**
 * API-M04-06 — Gộp giỏ khách vào thành viên
 * Gộp giỏ khi đăng nhập; cùng SKU cộng dồn nhưng không vượt tồn (M04-F08).
 * POST /api/v1/cart/merge · quyền: đăng nhập
 * Input: { guest_session_id }
 * Output: { merged_cart_id, total_items }
 */
export function mergeGuestCart({ body } = {}) {
  const endpoint = getApiEndpoint('API-M04-06');
  return api.post(endpoint.path, body);
}

/**
 * API-M04-07 — Áp mã giảm giá vào giỏ
 * Áp voucher cấp giỏ; dùng chung CouponService của M09 (M04-F07, OPEN_DECISIONS #9).
 * POST /api/v1/cart/apply-coupon · quyền: công khai hoặc đăng nhập
 * Input: { coupon_code }
 * Output: { discount_amount, new_total, message }
 */
export function applyCouponToCart({ body } = {}) {
  const endpoint = getApiEndpoint('API-M04-07');
  return api.post(endpoint.path, body);
}

/**
 * API-M04-08 — Xóa toàn bộ giỏ hàng
 * Xóa mọi dòng của giỏ hiện tại (M04-F05).
 * DELETE /api/v1/cart · quyền: công khai hoặc đăng nhập
 * Output: { success: true, removed_count, message, cart_summary }
 */
export function clearCart() {
  const endpoint = getApiEndpoint('API-M04-08');
  return api.delete(endpoint.path);
}

/**
 * API-M04-09 — Xác thực sản phẩm chọn thanh toán
 * Xác thực item thuộc giỏ, tính tạm tính/tổng tiền của đúng các dòng đã chọn (M04-F06).
 * PUT /api/v1/cart/selection · quyền: công khai hoặc đăng nhập
 * Input: { item_ids: [...] }
 */
export function selectCartItems({ body } = {}) {
  const endpoint = getApiEndpoint('API-M04-09');
  return api.put(endpoint.path, body);
}

/**
 * API-M04-10 — Để dành mua sau
 * Chuyển một dòng giỏ sang danh sách “Để dành mua sau” (M04-F10).
 * POST /api/v1/cart/items/[itemId]/save-for-later · quyền: công khai hoặc đăng nhập
 */
export function saveForLater({ itemId } = {}) {
  const endpoint = getApiEndpoint('API-M04-10');
  return api.post(resolveEndpointPath(endpoint.path, { itemId }));
}

/**
 * API-M04-11 — Khôi phục món đã lưu
 * Đưa món đã lưu trở lại giỏ nếu còn đủ tồn (M04-F10).
 * POST /api/v1/cart/saved-items/[savedItemId]/restore · quyền: công khai hoặc đăng nhập
 */
export function restoreSavedItem({ savedItemId } = {}) {
  const endpoint = getApiEndpoint('API-M04-11');
  return api.post(resolveEndpointPath(endpoint.path, { savedItemId }));
}

/**
 * API-M04-12 — Xóa món đã lưu
 * Xóa hẳn một món khỏi danh sách “Để dành mua sau” (M04-F10).
 * DELETE /api/v1/cart/saved-items/[savedItemId] · quyền: công khai hoặc đăng nhập
 */
export function removeSavedItem({ savedItemId } = {}) {
  const endpoint = getApiEndpoint('API-M04-12');
  return api.delete(resolveEndpointPath(endpoint.path, { savedItemId }));
}
