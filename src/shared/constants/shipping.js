/**
 * [SHARED] Vận chuyển — SRS M05-F03, M06-F08..F11
 */
export const SHIPPING_METHODS = Object.freeze({
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
});

export const SHIPPING_METHOD_VALUES = Object.freeze(Object.values(SHIPPING_METHODS));

export const SHIPPING_METHOD_LABELS = Object.freeze({
  STANDARD: 'Giao tiêu chuẩn',
  EXPRESS: 'Giao hỏa tốc',
});

export const CARRIER_CODES = Object.freeze({
  GHN: 'GHN',
  GHTK: 'GHTK',
  VIETTELPOST: 'VIETTELPOST',
});

export const CARRIER_CODE_VALUES = Object.freeze(Object.values(CARRIER_CODES));

export const CARRIER_LABELS = Object.freeze({
  GHN: 'Giao Hàng Nhanh (GHN)',
  GHTK: 'Giao Hàng Tiết Kiệm (GHTK)',
  VIETTELPOST: 'Viettel Post',
});

export const SHIPMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETURNING: 'RETURNING',
  RETURNED: 'RETURNED',
});

export const SHIPMENT_STATUS_VALUES = Object.freeze(Object.values(SHIPMENT_STATUS));

export const SHIPMENT_STATUS_LABELS = Object.freeze({
  PENDING: 'Chờ lấy hàng',
  PICKED_UP: 'Đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  OUT_FOR_DELIVERY: 'Đang giao',
  DELIVERED: 'Đã giao',
  FAILED: 'Giao thất bại',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',
});
