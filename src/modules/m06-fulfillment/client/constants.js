/**
 * [TOY-M06] Hằng số hiển thị dùng chung cho các trang đơn hàng và giao vận.
 */
import {
  CARRIER_CODE_VALUES,
  CARRIER_LABELS,
  SHIPMENT_STATUS_VALUES,
  SHIPMENT_STATUS_LABELS,
} from '@/shared/constants/shipping.js';
import {
  RETURN_REASON_LABELS,
  RETURN_REASON_VALUES,
  RETURN_STATUS_LABELS,
} from '@/shared/constants/support.js';

export const ORDER_STATUS_TONES = Object.freeze({
  PENDING_PAYMENT: 'warning',
  PENDING: 'info',
  PENDING_APPROVAL: 'warning',
  CONFIRMED: 'info',
  PACKING: 'info',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  CANCELLED_TIMEOUT: 'danger',
  DELIVERY_FAILED: 'danger',
  RETURNING: 'warning',
  RETURNED: 'neutral',
});

export const SHIPMENT_STATUS_TONES = Object.freeze({
  PENDING: 'warning',
  PICKED_UP: 'info',
  IN_TRANSIT: 'primary',
  OUT_FOR_DELIVERY: 'primary',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNING: 'warning',
  RETURNED: 'neutral',
});

export const RETURN_STATUS_TONES = Object.freeze({
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  RECEIVED: 'primary',
  REFUNDED: 'success',
  CANCELLED: 'neutral',
});

export const PAYMENT_STATUS_TONES = Object.freeze({
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
  CANCELLED: 'neutral',
});

export const CARRIER_OPTIONS = Object.freeze(
  CARRIER_CODE_VALUES.map((code) => ({ value: code, label: CARRIER_LABELS[code] ?? code })),
);

export const SHIPMENT_STATUS_OPTIONS = Object.freeze(
  SHIPMENT_STATUS_VALUES.map((status) => ({
    value: status,
    label: SHIPMENT_STATUS_LABELS[status] ?? status,
  })),
);

export const RETURN_REASON_OPTIONS = Object.freeze(
  RETURN_REASON_VALUES.map((reason) => ({
    value: reason,
    label: RETURN_REASON_LABELS[reason] ?? reason,
  })),
);

export const RETURN_STATUS_OPTIONS = Object.freeze(
  Object.keys(RETURN_STATUS_LABELS).map((status) => ({
    value: status,
    label: RETURN_STATUS_LABELS[status],
  })),
);
