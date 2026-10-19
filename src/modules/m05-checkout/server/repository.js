import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M05 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'orders',
  'order_items',
  'payment_transactions',
  'order_status_history',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M05-F06) — bảng `orders`.
 */
export async function createOrder(_data) {
  throw new NotImplementedError('M05-F06');
}

/**
 * TODO(M05-F10) — bảng `orders`.
 */
export async function findOrderByRef(_orderRef) {
  throw new NotImplementedError('M05-F10');
}

/**
 * TODO(M05-F10) — bảng `orders`.
 */
export async function findOrderById(_id) {
  throw new NotImplementedError('M05-F10');
}

/**
 * TODO(M05-F10) — bảng `orders`.
 */
export async function listOrdersByUser(_userId, _filters) {
  throw new NotImplementedError('M05-F10');
}

/**
 * TODO(M05-F11) — bảng `orders`.
 */
export async function listAdminOrders(_filters) {
  throw new NotImplementedError('M05-F11');
}

/**
 * TODO(M05-F11) — bảng `orders`.
 */
export async function updateOrderStatus(_id, _status, _patch) {
  throw new NotImplementedError('M05-F11');
}

/**
 * TODO(M05-F06) — bảng `order_items`.
 */
export async function createOrderItems(_orderId, _items) {
  throw new NotImplementedError('M05-F06');
}

/**
 * TODO(M05-F03) — bảng `order_items`.
 */
export async function listOrderItems(_orderId) {
  throw new NotImplementedError('M05-F03');
}

/**
 * TODO(M05-F07) — bảng `payment_transactions`.
 */
export async function createPaymentTransaction(_data) {
  throw new NotImplementedError('M05-F07');
}

/**
 * TODO(M05-F07) — bảng `payment_transactions`.
 */
export async function findPaymentTransactionByIdempotencyKey(_key) {
  throw new NotImplementedError('M05-F07');
}

/**
 * TODO(M05-F07) — bảng `payment_transactions`.
 */
export async function updatePaymentTransaction(_id, _patch) {
  throw new NotImplementedError('M05-F07');
}

/**
 * TODO(M05-F11) — bảng `order_status_history`.
 */
export async function appendOrderStatusHistory(_data) {
  throw new NotImplementedError('M05-F11');
}

/**
 * TODO(M05-F10) — bảng `order_status_history`.
 */
export async function listOrderStatusHistory(_orderId) {
  throw new NotImplementedError('M05-F10');
}
