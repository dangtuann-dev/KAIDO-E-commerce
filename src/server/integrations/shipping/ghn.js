import 'server-only';

/**
 * [SERVER] Adapter GHN (Giao Hàng Nhanh).
 * SRS: M06-F08 (biểu phí), M06-F09 (vận đơn), M06-F10 (webhook), M06-F11 (hoàn hàng).
 * Có cấu hình GHN_TOKEN + GHN_SHOP_ID → gọi API thật; thiếu khóa → mô phỏng ngoài production.
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

export const CODE = 'GHN';
const DEFAULT_API_URL = 'https://online-gateway.ghn.vn';
const STANDARD_SERVICE_TYPE = 2;
const EXPRESS_SERVICE_TYPE = 1;

/**
 * @returns {{ mode: 'live' | 'simulation', token: string | null, shopId: string | null, apiUrl: string }}
 */
export function getSettings() {
  const { values, configured } = getCarrierEnv(CODE);
  if (configured) {
    return {
      mode: 'live',
      token: values.token,
      shopId: values.shopId,
      apiUrl: (values.apiUrl || DEFAULT_API_URL).replace(/\/$/, ''),
    };
  }
  return { mode: 'simulation', token: null, shopId: null, apiUrl: DEFAULT_API_URL };
}

const STATUS_MAP = Object.freeze({
  ready_to_pick: SHIPMENT_STATUS.PENDING,
  picking: SHIPMENT_STATUS.PENDING,
  money_collect_picking: SHIPMENT_STATUS.PENDING,
  picked: SHIPMENT_STATUS.PICKED_UP,
  storing: SHIPMENT_STATUS.IN_TRANSIT,
  transporting: SHIPMENT_STATUS.IN_TRANSIT,
  sorting: SHIPMENT_STATUS.IN_TRANSIT,
  delivering: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  delivered: SHIPMENT_STATUS.DELIVERED,
  delivery_fail: SHIPMENT_STATUS.FAILED,
  waiting_to_return: SHIPMENT_STATUS.RETURNING,
  return: SHIPMENT_STATUS.RETURNING,
  return_transporting: SHIPMENT_STATUS.RETURNING,
  return_sorting: SHIPMENT_STATUS.RETURNING,
  returning: SHIPMENT_STATUS.RETURNING,
  returned: SHIPMENT_STATUS.RETURNED,
  cancel: SHIPMENT_STATUS.FAILED,
});

function headers(settings) {
  return { Token: settings.token, ShopId: String(settings.shopId) };
}

/**
 * @param {{ method?: 'STANDARD' | 'EXPRESS', toDistrictId?: number, toWardCode?: string, weightGram?: number, valueVnd?: number, innerCity?: boolean }} input
 * @returns {Promise<{ feeVnd: number, serviceName: string, mode: 'live' | 'simulation' }>}
 */
export async function calculateFee(input = {}) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return { feeVnd: simulateFee(input), serviceName: 'GHN', mode: 'simulation' };
  }

  const payload = await requestJson(`${settings.apiUrl}/shipping-order/fee`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      to_district_id: Number(input.toDistrictId) || 0,
      to_ward_code: String(input.toWardCode || ''),
      weight: Math.max(1, Math.round(Number(input.weightGram) || 0)),
      insurance_value: Math.max(0, Math.round(Number(input.valueVnd) || 0)),
      service_type_id: input.method === 'EXPRESS' ? EXPRESS_SERVICE_TYPE : STANDARD_SERVICE_TYPE,
    },
  });

  const fee = Number(payload?.data?.total);
  if (!Number.isFinite(fee) || fee <= 0) {
    return { feeVnd: simulateFee(input), serviceName: 'GHN', mode: 'live' };
  }
  return { feeVnd: Math.round(fee), serviceName: 'GHN', mode: 'live' };
}

/**
 * @param {{ orderRef: string, toName: string, toPhone: string, toAddress: string, toDistrictId?: number, toWardCode?: string, weightGram?: number, method?: 'STANDARD' | 'EXPRESS', items?: Array<{ name?: string, sku?: string, quantity?: number, priceVnd?: number, weightGram?: number }> }} input
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

  const payload = await requestJson(`${settings.apiUrl}/shipping-order/create`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      payment_type_id: 2,
      required_note: 'CHOXEMHANGKHONGTHU',
      to_name: input.toName,
      to_phone: input.toPhone,
      to_address: input.toAddress,
      to_district_id: Number(input.toDistrictId) || 0,
      to_ward_code: String(input.toWardCode || ''),
      weight: Math.max(1, Math.round(Number(input.weightGram) || 500)),
      length: 20,
      width: 20,
      height: 10,
      service_type_id: input.method === 'EXPRESS' ? EXPRESS_SERVICE_TYPE : STANDARD_SERVICE_TYPE,
      items: (input.items || []).map((item) => ({
        name: item.name || 'Sản phẩm',
        code: item.sku || undefined,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.priceVnd) || 0),
        weight: Math.max(1, Number(item.weightGram) || 200),
      })),
    },
  });

  const trackingCode = payload?.data?.order_code;
  if (!trackingCode) {
    return {
      trackingCode: buildTrackingCode(CODE, input.orderRef),
      expectedDeliveryAt: expectedDeliveryAt(input.method),
      mode: 'live',
    };
  }

  const expected = payload?.data?.expected_delivery_time
    ? new Date(payload.data.expected_delivery_time).toISOString()
    : expectedDeliveryAt(input.method);
  return { trackingCode, expectedDeliveryAt: expected, mode: 'live' };
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

  const payload = await requestJson(`${settings.apiUrl}/shipping-order/detail`, {
    carrier: CODE,
    headers: headers(settings),
    body: { order_code: trackingCode },
  });

  const logs = Array.isArray(payload?.data?.log) ? payload.data.log : [];
  const events = logs.map((log) => ({
    at: log.updated_date ? new Date(Number(log.updated_date) || log.updated_date).toISOString() : new Date().toISOString(),
    status: STATUS_MAP[log.status] || SHIPMENT_STATUS.IN_TRANSIT,
    description: log.status_name || log.status || 'Cập nhật vận đơn.',
  }));
  const status = STATUS_MAP[payload?.data?.status] || events.at(-1)?.status || SHIPMENT_STATUS.IN_TRANSIT;
  return { status, events, mode: 'live' };
}

/**
 * Chuẩn hóa payload webhook GHN.
 * @param {unknown} body
 * @returns {{ trackingCode: string | null, status: string | null, description: string | null, location: string | null, occurredAt: string | null }}
 */
export function parseWebhook(body = {}) {
  const raw = body && typeof body === 'object' && body.data ? body.data : body || {};
  const statusKey = String(raw.Status ?? raw.status ?? '').toLowerCase();
  const trackingCode = raw.OrderCode ?? raw.order_code ?? raw.TrackingCode ?? null;
  return {
    trackingCode: trackingCode ? String(trackingCode) : null,
    status: STATUS_MAP[statusKey] || null,
    description: raw.Description ?? raw.description ?? raw.StatusName ?? null,
    location: raw.Warehouse ?? raw.Location ?? raw.location ?? null,
    occurredAt: parseTimestamp(raw.Time ?? raw.updated_date ?? raw.UpdatedDate),
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

  const payload = await requestJson(`${settings.apiUrl}/switch-status/cancel`, {
    carrier: CODE,
    headers: headers(settings),
    body: { order_codes: [trackingCode] },
  });
  return { cancelled: payload?.code === 200, mode: 'live' };
}
