import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M04 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze(['carts', 'cart_items', 'cart_saved_items']);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M04-F02) — bảng `carts`.
 */
export async function findActiveCartByUser(_userId) {
  throw new NotImplementedError('M04-F02');
}

/**
 * TODO(M04-F02) — bảng `carts`.
 */
export async function findActiveCartByGuest(_guestSessionId) {
  throw new NotImplementedError('M04-F02');
}

/**
 * TODO(M04-F02) — bảng `carts`.
 */
export async function createCart(_data) {
  throw new NotImplementedError('M04-F02');
}

/**
 * TODO(M04-F08) — bảng `carts`.
 */
export async function updateCartStatus(_id, _status) {
  throw new NotImplementedError('M04-F08');
}

/**
 * TODO(M04-F02) — bảng `cart_items`.
 */
export async function listCartItems(_cartId) {
  throw new NotImplementedError('M04-F02');
}

/**
 * TODO(M04-F01) — bảng `cart_items`.
 */
export async function addCartItem(_cartId, _data) {
  throw new NotImplementedError('M04-F01');
}

/**
 * TODO(M04-F03) — bảng `cart_items`.
 */
export async function updateCartItem(_id, _patch) {
  throw new NotImplementedError('M04-F03');
}

/**
 * TODO(M04-F04) — bảng `cart_items`.
 */
export async function removeCartItem(_id) {
  throw new NotImplementedError('M04-F04');
}

/**
 * TODO(M04-F04) — bảng `cart_items`.
 */
export async function removeCartItems(_ids) {
  throw new NotImplementedError('M04-F04');
}

/**
 * TODO(M04-F10) — bảng `cart_saved_items`.
 */
export async function listSavedItems(_userId) {
  throw new NotImplementedError('M04-F10');
}

/**
 * TODO(M04-F10) — bảng `cart_saved_items`.
 */
export async function createSavedItem(_userId, _data) {
  throw new NotImplementedError('M04-F10');
}

/**
 * TODO(M04-F10) — bảng `cart_saved_items`.
 */
export async function deleteSavedItem(_id) {
  throw new NotImplementedError('M04-F10');
}
