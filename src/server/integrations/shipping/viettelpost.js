import 'server-only';

/**
 * [SERVER] Adapter Viettel Post.
 * SRS: M06-F08..F11. Có VIETTELPOST_TOKEN → gọi API thật; thiếu khóa → mô phỏng ngoài production.
 * Token lấy từ nghiệp vụ đăng nhập đối tác (username/password) và được cấu hình sẵn trong env.
 */
import { SHIPMENT_STATUS } from '@/shared/constants/shipping.js';
import { getCarrierEnv } from '@/server/env.js';
import {
  assertSimulationAllowed,
  buildTrackingCode,
  expectedDeliveryAt,
  parseTimestamp,
  requestJson,
  simulateFee,
  simulateTracking,
} from './shared.js';

export const CODE = 'VIETTELPOST';
const DEFAULT_API_URL = 'https://partner.viettelpost.vn';

/**
 * @returns {{ mode: 'live' | 'simulation', token: string | null, apiUrl: string }}
 */
export function getSettings() {
  const { values, configured } = getCarrierEnv(CODE);
  if (configured) {
    return {
      mode: 'live',
      token: values.token,
      apiUrl: (values.apiUrl || DEFAULT_API_URL).replace(/\/$/, ''),
    };
  }
  return { mode: 'simulation', token: null, apiUrl: DEFAULT_API_URL };
}

const STATUS_MAP = Object.freeze({
  100: SHIPMENT_STATUS.PENDING,
  101: SHIPMENT_STATUS.PENDING,
  102: SHIPMENT_STATUS.PICKED_UP,
  103: SHIPMENT_STATUS.PICKED_UP,
  104: SHIPMENT_STATUS.IN_TRANSIT,
  107: SHIPMENT_STATUS.FAILED,
  200: SHIPMENT_STATUS.PICKED_UP,
  300: SHIPMENT_STATUS.IN_TRANSIT,
  301: SHIPMENT_STATUS.IN_TRANSIT,
  400: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  500: SHIPMENT_STATUS.IN_TRANSIT,
  501: SHIPMENT_STATUS.DELIVERED,
  502: SHIPMENT_STATUS.FAILED,
  503: SHIPMENT_STATUS.RETURNING,
  504: SHIPMENT_STATUS.RETURNING,
  505: SHIPMENT_STATUS.RETURNING,
  506: SHIPMENT_STATUS.RETURNED,
  507: SHIPMENT_STATUS.RETURNED,
});

function headers(settings) {
  return { Token: settings.token };
}

/**
 * @param {{ method?: 'STANDARD' | 'EXPRESS', toProvinceId?: number, toDistrictId?: number, weightGram?: number, valueVnd?: number, innerCity?: boolean }} input
 * @returns {Promise<{ feeVnd: number, serviceName: string, mode: 'live' | 'simulation' }>}
 */
export async function calculateFee(input = {}) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return { feeVnd: simulateFee(input), serviceName: 'Viettel Post', mode: 'simulation' };
  }

  const payload = await requestJson(`${settings.apiUrl}/v2/order/getPriceAll`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      PRODUCT_WEIGHT: Math.max(1, Math.round(Number(input.weightGram) || 0)),
      PRODUCT_PRICE: Math.max(0, Math.round(Number(input.valueVnd) || 0)),
      RECEIVER_PROVINCE_ID: Number(input.toProvinceId) || 0,
      RECEIVER_DISTRICT_ID: Number(input.toDistrictId) || 0,
      PRODUCT_TYPE: input.method === 'EXPRESS' ? 'HH' : 'LCOD',
    },
  });

  const options = Array.isArray(payload?.data) ? payload.data : [];
  const fees = options
    .map((option) => Number(option?.GIA_CUOC ?? option?.MONEY_TOTAL))
    .filter((fee) => Number.isFinite(fee) && fee > 0);
  if (fees.length === 0) {
    return { feeVnd: simulateFee(input), serviceName: 'Viettel Post', mode: 'live' };
  }
  return { feeVnd: Math.round(Math.min(...fees)), serviceName: 'Viettel Post', mode: 'live' };
}

/**
 * @param {{ orderRef: string, toName: string, toPhone: string, toAddress: string, toProvinceId?: number, toDistrictId?: number, toWardId?: number, weightGram?: number, codVnd?: number, method?: 'STANDARD' | 'EXPRESS', items?: Array<{ name?: string, sku?: string, quantity?: number, priceVnd?: number, weightGram?: number }> }} input
 * @returns {Promise<{ trackingCode: string, expectedDeliveryAt: string, mode: 'live' | 'simulation' }>}
 */
export async function createShipment(input) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return {
      trackingCode: buildTrackingCode(CODE, input.orderRef),
      expectedDeliveryAt: expectedDeliveryAt(input.method),
      mode: 'simulation',
    };
  }

  const payload = await requestJson(`${settings.apiUrl}/v2/order/createOrder`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      ORDER_NUMBER: input.orderRef,
      GROUPADDRESS_ID: 0,
      CUS_ID: 0,
      DELIVERY_DATE: new Date().toISOString(),
      SENDER_FULLNAME: 'KAIDO',
      SENDER_ADDRESS: 'TP. Hồ Chí Minh',
      SENDER_PHONE: '0280000000',
      RECEIVER_FULLNAME: input.toName,
      RECEIVER_ADDRESS: input.toAddress,
      RECEIVER_PHONE: input.toPhone,
      RECEIVER_PROVINCE: Number(input.toProvinceId) || 0,
      RECEIVER_DISTRICT: Number(input.toDistrictId) || 0,
      RECEIVER_WARD: Number(input.toWardId) || 0,
      PRODUCT_NAME: (input.items || []).map((item) => item.name || 'Sản phẩm').join(', ').slice(0, 200),
      PRODUCT_WEIGHT: Math.max(1, Math.round(Number(input.weightGram) || 500)),
      PRODUCT_PRICE: Math.max(0, Math.round(Number(input.codVnd) || 0)),
      PRODUCT_TYPE: input.method === 'EXPRESS' ? 'HH' : 'LCOD',
      ORDER_PAYMENT: 3,
      ORDER_SERVICE: input.method === 'EXPRESS' ? 'VHT' : 'VTK',
      ORDER_SERVICE_ADD: '',
      ORDER_NOTE: '',
    },
  });

  const trackingCode = payload?.data?.ORDER_NUMBER;
  if (!trackingCode) {
    return {
      trackingCode: buildTrackingCode(CODE, input.orderRef),
      expectedDeliveryAt: expectedDeliveryAt(input.method),
      mode: 'live',
    };
  }
  return { trackingCode: String(trackingCode), expectedDeliveryAt: expectedDeliveryAt(input.method), mode: 'live' };
}

/**
 * @param {string} trackingCode
 * @param {{ createdAt?: string }} [context]
 * @returns {Promise<{ status: string, events: Array<{ at: string, status: string, description: string }>, mode: 'live' | 'simulation' }>}
 */
export async function getTracking(trackingCode, context = {}) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return { ...simulateTracking({ trackingCode, createdAt: context.createdAt }), mode: 'simulation' };
  }

  const payload = await requestJson(`${settings.apiUrl}/v2/order/getOrderInfo`, {
    carrier: CODE,
    headers: headers(settings),
    body: { TYPE: 1, ORDER_NUMBER: [trackingCode] },
  });

  const order = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;
  const status = STATUS_MAP[order?.ORDER_STATUS] || SHIPMENT_STATUS.IN_TRANSIT;
  const events = [
    {
      at: order?.ORDER_STATUSDATE ? new Date(order.ORDER_STATUSDATE).toISOString() : new Date().toISOString(),
      status,
      description: order?.ORDER_STATUS_NAME || 'Cập nhật vận đơn.',
    },
  ];
  return { status, events, mode: 'live' };
}

/**
 * Chuẩn hóa payload webhook Viettel Post.
 * @param {unknown} body
 * @returns {{ trackingCode: string | null, status: string | null, description: string | null, location: string | null, occurredAt: string | null }}
 */
export function parseWebhook(body = {}) {
  const raw = body && typeof body === 'object' && body.data && !Array.isArray(body.data)
    ? body.data
    : body || {};
  const trackingCode = raw.ORDER_NUMBER ?? raw.order_number ?? null;
  return {
    trackingCode: trackingCode ? String(trackingCode) : null,
    status: STATUS_MAP[raw.ORDER_STATUS] || null,
    description: raw.ORDER_STATUS_NAME ?? raw.NOTE ?? null,
    location: raw.PROVINCE_NAME ?? raw.ADDRESS ?? null,
    occurredAt: parseTimestamp(raw.ORDER_STATUSDATE ?? raw.UPDATED_DATE),
  };
}

/**
 * @param {string} trackingCode
 * @returns {Promise<{ cancelled: boolean, mode: 'live' | 'simulation' }>}
 */
export async function cancelShipment(trackingCode) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return { cancelled: true, mode: 'simulation' };
  }

  const payload = await requestJson(`${settings.apiUrl}/v2/order/UpdateOrder`, {
    carrier: CODE,
    headers: headers(settings),
    body: { TYPE: 4, ORDER_NUMBER: trackingCode, NOTE: 'Hủy vận đơn theo yêu cầu của cửa hàng.' },
  });
  return { cancelled: Boolean(payload?.status) || payload?.error === false, mode: 'live' };
}
