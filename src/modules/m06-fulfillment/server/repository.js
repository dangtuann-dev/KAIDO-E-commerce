import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M06 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'shipments',
  'shipment_events',
  'shipping_fee_rules',
  'return_requests',
  'return_request_items',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M06-F09) — bảng `shipments`.
 */
export async function createShipment(_data) {
  throw new NotImplementedError('M06-F09');
}

/**
 * TODO(M06-F03) — bảng `shipments`.
 */
export async function findShipmentByOrder(_orderId) {
  throw new NotImplementedError('M06-F03');
}

/**
 * TODO(M06-F10) — bảng `shipments`.
 */
export async function updateShipmentStatus(_id, _status, _patch) {
  throw new NotImplementedError('M06-F10');
}

/**
 * TODO(M06-F10) — bảng `shipment_events`.
 */
export async function appendShipmentEvent(_data) {
  throw new NotImplementedError('M06-F10');
}

/**
 * TODO(M06-F03) — bảng `shipment_events`.
 */
export async function listShipmentEvents(_shipmentId) {
  throw new NotImplementedError('M06-F03');
}

/**
 * TODO(M06-F08) — bảng `shipping_fee_rules`.
 */
export async function findShippingFeeRules(_filters) {
  throw new NotImplementedError('M06-F08');
}

/**
 * TODO(M06-F12) — bảng `return_requests`.
 */
export async function createReturnRequest(_data) {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F12) — bảng `return_requests`.
 */
export async function findReturnRequestById(_id) {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F12) — bảng `return_requests`.
 */
export async function listReturnRequestsByOrder(_orderId) {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F12) — bảng `return_requests`.
 */
export async function updateReturnRequestStatus(_id, _status, _patch) {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F12) — bảng `return_request_items`.
 */
export async function createReturnRequestItems(_returnRequestId, _items) {
  throw new NotImplementedError('M06-F12');
}
