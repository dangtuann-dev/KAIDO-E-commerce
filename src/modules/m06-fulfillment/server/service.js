import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M06-F01) — Nhận đơn do M05 tạo và đưa vào hàng đợi xử lý.
 */
export async function acceptOrder() {
  throw new NotImplementedError('M06-F01');
}

/**
 * TODO(M06-F02) — Chi tiết đơn theo góc nhìn fulfillment, ủy quyền M05.
 */
export async function getFulfillmentOrderDetail() {
  throw new NotImplementedError('M06-F02');
}

/**
 * TODO(M06-F03) — Timeline từ shipment_events của chủ đơn.
 */
export async function getOrderTracking() {
  throw new NotImplementedError('M06-F03');
}

/**
 * TODO(M06-F04) — Hủy theo quyền và giải phóng tồn kho; dùng chung handler M05.
 */
export async function cancelOrder() {
  throw new NotImplementedError('M06-F04');
}

/**
 * TODO(M06-F05) — Tra cứu đơn theo mã/khách/trạng thái.
 */
export async function searchAdminOrders() {
  throw new NotImplementedError('M06-F05');
}

/**
 * TODO(M06-F06) — Chuyển PENDING/PENDING_APPROVAL -> CONFIRMED.
 */
export async function confirmOrder() {
  throw new NotImplementedError('M06-F06');
}

/**
 * TODO(M06-F07) — Chuyển CONFIRMED -> PACKING, ghi log.
 */
export async function updatePackingProgress() {
  throw new NotImplementedError('M06-F07');
}

/**
 * TODO(M06-F08) — Nội thành 25.000đ, tỉnh 35.000–50.000đ, miễn phí từ 500.000đ (BR-M06-03).
 */
export async function calculateShippingFee() {
  throw new NotImplementedError('M06-F08');
}

/**
 * TODO(M06-F09) — Tạo vận đơn, gọi fulfill_stock, chuyển SHIPPING (BR-M06-04).
 */
export async function createFulfillment() {
  throw new NotImplementedError('M06-F09');
}

/**
 * TODO(M06-F10) — Xác minh HMAC, cập nhật shipment_events + trạng thái đơn.
 */
export async function handleCarrierWebhook() {
  throw new NotImplementedError('M06-F10');
}

/**
 * TODO(M06-F11) — Tối đa 3 lần giao, sau đó RETURNING (BR-M06-05).
 */
export async function handleDeliveryFailure() {
  throw new NotImplementedError('M06-F11');
}

/**
 * TODO(M06-F12) — Đổi trả trong 7 ngày, tối thiểu 1 ảnh, đơn COMPLETED.
 */
export async function createReturnRequest() {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F12) — Duyệt/từ chối và tính refund_amount.
 */
export async function approveReturnRequest() {
  throw new NotImplementedError('M06-F12');
}

/**
 * TODO(M06-F13) — Ghi notifications/hàng đợi email; không gửi đồng bộ trong request.
 */
export async function notifyOrderStatus() {
  throw new NotImplementedError('M06-F13');
}

/**
 * TODO(M06-F14) — Thống kê đơn theo trạng thái/kênh/thời gian.
 */
export async function getOrderReports() {
  throw new NotImplementedError('M06-F14');
}
