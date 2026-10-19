/**
 * [SHARED] Phương thức & trạng thái thanh toán — SRS M05-F04, F07
 * Không lưu thông tin thẻ; toàn bộ xử lý thẻ thuộc cổng thanh toán (SYS-NFR-04).
 */
export const PAYMENT_METHODS = Object.freeze({
  COD: 'COD',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
  ZALOPAY: 'ZALOPAY',
});

export const PAYMENT_METHOD_VALUES = Object.freeze(Object.values(PAYMENT_METHODS));

export const PAYMENT_METHOD_LABELS = Object.freeze({
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'VNPAY',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
});

export const ONLINE_PAYMENT_METHODS = Object.freeze([
  PAYMENT_METHODS.VNPAY,
  PAYMENT_METHODS.MOMO,
  PAYMENT_METHODS.ZALOPAY,
]);

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
});

export const PAYMENT_STATUS_VALUES = Object.freeze(Object.values(PAYMENT_STATUS));

export const PAYMENT_STATUS_LABELS = Object.freeze({
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy giao dịch',
});

export function isOnlinePayment(method) {
  return ONLINE_PAYMENT_METHODS.includes(method);
}
