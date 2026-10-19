/**
 * [SHARED] Trạng thái đơn hàng thống nhất M05 + M06 — SRS BR-M06-01
 * Khi mâu thuẫn tên trạng thái giữa M05/M06, dùng enum này (OPEN_DECISIONS #6).
 */
export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  CONFIRMED: 'CONFIRMED',
  PACKING: 'PACKING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  CANCELLED_TIMEOUT: 'CANCELLED_TIMEOUT',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  RETURNING: 'RETURNING',
  RETURNED: 'RETURNED',
});

export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

export const ORDER_STATUS_LABELS = Object.freeze({
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING: 'Chờ xử lý',
  PENDING_APPROVAL: 'Chờ xác nhận (COD giá trị cao)',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  CANCELLED_TIMEOUT: 'Hủy do quá hạn thanh toán',
  DELIVERY_FAILED: 'Giao thất bại',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',
});

const TERMINAL = [];

/**
 * Bảng chuyển trạng thái hợp lệ — BR-M06-01.
 * Không cho nhảy cóc bước đóng gói: CONFIRMED -> PACKING -> SHIPPING.
 */
export const ORDER_TRANSITIONS = Object.freeze({
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED', 'CANCELLED_TIMEOUT'],
  PENDING: ['PENDING_APPROVAL', 'CONFIRMED', 'CANCELLED'],
  PENDING_APPROVAL: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING'],
  SHIPPING: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: ['COMPLETED', 'RETURNING'],
  COMPLETED: ['RETURNING'],
  DELIVERY_FAILED: ['RETURNING'],
  RETURNING: ['RETURNED', 'DELIVERED'],
  CANCELLED: TERMINAL,
  CANCELLED_TIMEOUT: TERMINAL,
  RETURNED: TERMINAL,
});

export const CUSTOMER_CANCELLABLE_STATUSES = Object.freeze([
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PENDING_APPROVAL,
  ORDER_STATUS.CONFIRMED,
]);

export const ORDER_HISTORY_CHANGE_SOURCES = Object.freeze({
  SYSTEM: 'SYSTEM',
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  WEBHOOK: 'WEBHOOK',
});

export function canTransitionOrder(fromStatus, toStatus) {
  return (ORDER_TRANSITIONS[fromStatus] || []).includes(toStatus);
}
