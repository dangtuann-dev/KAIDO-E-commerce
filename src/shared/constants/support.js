/**
 * [SHARED] Hỗ trợ khách hàng, đánh giá, đổi trả — SRS M06, M10
 */
export const REVIEW_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  HIDDEN: 'HIDDEN',
});

export const REVIEW_STATUS_VALUES = Object.freeze(Object.values(REVIEW_STATUS));

export const REVIEW_STATUS_LABELS = Object.freeze({
  PENDING: 'Chờ kiểm duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  HIDDEN: 'Đã ẩn',
});

export const TICKET_STATUS = Object.freeze({
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
});

export const TICKET_STATUS_VALUES = Object.freeze(Object.values(TICKET_STATUS));

export const TICKET_STATUS_LABELS = Object.freeze({
  OPEN: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
});

export const TICKET_CATEGORIES = Object.freeze({
  ORDER_ISSUE: 'ORDER_ISSUE',
  WARRANTY_RETURN: 'WARRANTY_RETURN',
  PRODUCT_INQUIRY: 'PRODUCT_INQUIRY',
  PAYMENT: 'PAYMENT',
  OTHER: 'OTHER',
});

export const TICKET_CATEGORY_VALUES = Object.freeze(Object.values(TICKET_CATEGORIES));

export const TICKET_CATEGORY_LABELS = Object.freeze({
  ORDER_ISSUE: 'Vấn đề đơn hàng',
  WARRANTY_RETURN: 'Bảo hành / đổi trả',
  PRODUCT_INQUIRY: 'Tư vấn sản phẩm',
  PAYMENT: 'Thanh toán',
  OTHER: 'Khác',
});

export const TICKET_PRIORITIES = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

export const TICKET_PRIORITY_VALUES = Object.freeze(Object.values(TICKET_PRIORITIES));

export const TICKET_PRIORITY_LABELS = Object.freeze({
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
});

export const TICKET_SENDER_TYPES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  SYSTEM: 'SYSTEM',
});

export const RETURN_REASONS = Object.freeze({
  DAMAGED_IN_TRANSIT: 'DAMAGED_IN_TRANSIT',
  DEFECTIVE: 'DEFECTIVE',
  WRONG_ITEM: 'WRONG_ITEM',
  OTHER: 'OTHER',
});

export const RETURN_REASON_VALUES = Object.freeze(Object.values(RETURN_REASONS));

export const RETURN_REASON_LABELS = Object.freeze({
  DAMAGED_IN_TRANSIT: 'Hư hỏng do vận chuyển',
  DEFECTIVE: 'Lỗi từ nhà sản xuất',
  WRONG_ITEM: 'Giao sai sản phẩm',
  OTHER: 'Lý do khác',
});

export const RETURN_STATUS = Object.freeze({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RECEIVED: 'RECEIVED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
});

export const RETURN_STATUS_VALUES = Object.freeze(Object.values(RETURN_STATUS));

export const RETURN_STATUS_LABELS = Object.freeze({
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  RECEIVED: 'Đã nhận hàng hoàn',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy yêu cầu',
});

export const REVIEW_MODERATION_ACTIONS = Object.freeze({
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  HIDE: 'HIDE',
});

export const REVIEW_MODERATION_ACTION_VALUES = Object.freeze(
  Object.values(REVIEW_MODERATION_ACTIONS),
);
