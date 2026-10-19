import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M05-F01) — Tính tạm tính, phí ship, coupon, điểm trước khi đặt.
 */
export async function getCheckoutSummary() {
  throw new NotImplementedError('M05-F01');
}

/**
 * TODO(M05-F02) — Lưu snapshot người nhận/địa chỉ cho bước xác nhận.
 */
export async function saveShippingInformation() {
  throw new NotImplementedError('M05-F02');
}

/**
 * TODO(M05-F03) — Ủy quyền M06 tính phí vận chuyển.
 */
export async function getShippingOptions() {
  throw new NotImplementedError('M05-F03');
}

/**
 * TODO(M05-F04) — Kiểm tra phương thức thanh toán và điều kiện COD (BR-M05-03).
 */
export async function selectPaymentMethod() {
  throw new NotImplementedError('M05-F04');
}

/**
 * TODO(M05-F05) — Gọi CouponService M09 và M07 để tính giảm giá hợp lệ.
 */
export async function applyOrderDiscounts() {
  throw new NotImplementedError('M05-F05');
}

/**
 * TODO(M05-F06) — Tạo đơn + order_items + reserve_stock trong một transaction (BR-M05-01, M05-F06).
 */
export async function placeOrder() {
  throw new NotImplementedError('M05-F06');
}

/**
 * TODO(M05-F07) — Sinh payment URL qua integration VNPAY/MoMo/ZaloPay.
 */
export async function initiateOnlinePayment() {
  throw new NotImplementedError('M05-F07');
}

/**
 * TODO(M05-F07) — Xác minh HMAC-SHA512, idempotency và cập nhật giao dịch.
 */
export async function handleVnpayIpn() {
  throw new NotImplementedError('M05-F07');
}

/**
 * TODO(M05-F08) — Dữ liệu trang cảm ơn và thông báo đã xếp hàng gửi email.
 */
export async function getOrderSuccess() {
  throw new NotImplementedError('M05-F08');
}

/**
 * TODO(M05-F09) — Hàm RPC/PL/pgSQL gọi bởi pg_cron mỗi phút; không chạy worker thường trực.
 */
export async function cancelTimeoutOrders() {
  throw new NotImplementedError('M05-F09');
}

/**
 * TODO(M05-F10) — Chi tiết đơn + lịch sử trạng thái + thanh toán của chủ đơn.
 */
export async function getOrderDetail() {
  throw new NotImplementedError('M05-F10');
}

/**
 * TODO(M05-F10) — Danh sách đơn của khách, lọc trạng thái/thời gian.
 */
export async function listCustomerOrders() {
  throw new NotImplementedError('M05-F10');
}

/**
 * TODO(M05-F11) — Lọc đơn theo trạng thái/từ khóa/ngày.
 */
export async function listAdminOrders() {
  throw new NotImplementedError('M05-F11');
}

/**
 * TODO(M05-F11) — Kiểm tra ORDER_TRANSITIONS, ghi order_status_history bất biến.
 */
export async function updateOrderStatus() {
  throw new NotImplementedError('M05-F11');
}

/**
 * TODO(M05-F09) — Khách hủy đơn được phép; giải phóng tồn kho qua M08.
 */
export async function cancelOrder() {
  throw new NotImplementedError('M05-F09');
}
