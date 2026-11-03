import 'server-only';

/**
 * [SERVER] Adapter GHTK (Giao Hàng Tiết Kiệm).
 * SRS: M06-F08..F11. Có GHTK_TOKEN → gọi API thật; thiếu khóa → mô phỏng ngoài production.
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

export const CODE = 'GHTK';
const DEFAULT_API_URL = 'https://services.giaohangtietkiem.vn';

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
  '-1': SHIPMENT_STATUS.FAILED,
  1: SHIPMENT_STATUS.PENDING,
  2: SHIPMENT_STATUS.PICKED_UP,
  3: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
  4: SHIPMENT_STATUS.DELIVERED,
  5: SHIPMENT_STATUS.FAILED,
  6: SHIPMENT_STATUS.IN_TRANSIT,
  7: SHIPMENT_STATUS.RETURNING,
  8: SHIPMENT_STATUS.RETURNING,
  9: SHIPMENT_STATUS.RETURNED,
  10: SHIPMENT_STATUS.IN_TRANSIT,
});

function headers(settings) {
  return { Token: settings.token };
}

/**
 * @param {{ method?: 'STANDARD' | 'EXPRESS', toProvince?: string, toDistrict?: string, toWard?: string, weightGram?: number, valueVnd?: number, innerCity?: boolean }} input
 * @returns {Promise<{ feeVnd: number, serviceName: string, mode: 'live' | 'simulation' }>}
 */
export async function calculateFee(input = {}) {
  const settings = getSettings();
  if (settings.mode === 'simulation') {
    assertSimulationAllowed(CODE);
    return { feeVnd: simulateFee(input), serviceName: 'GHTK', mode: 'simulation' };
  }

  const payload = await requestJson(`${settings.apiUrl}/services/shipment/fee`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      province: input.toProvince || '',
      district: input.toDistrict || '',
      ward: input.toWard || '',
      address: input.toAddress || '',
      weight: Math.max(1, Math.round(Number(input.weightGram) || 0)),
      value: Math.max(0, Math.round(Number(input.valueVnd) || 0)),
      deliver_option: input.method === 'EXPRESS' ? 'xteam' : 'none',
    },
  });

  const fee = Number(payload?.fee?.fee);
  if (!Number.isFinite(fee) || fee <= 0) {
    return { feeVnd: simulateFee(input), serviceName: 'GHTK', mode: 'live' };
  }
  return { feeVnd: Math.round(fee), serviceName: 'GHTK', mode: 'live' };
}

/**
 * @param {{ orderRef: string, toName: string, toPhone: string, toAddress: string, toProvince?: string, toDistrict?: string, toWard?: string, weightGram?: number, codVnd?: number, method?: 'STANDARD' | 'EXPRESS', items?: Array<{ name?: string, sku?: string, quantity?: number, priceVnd?: number, weightGram?: number }> }} input
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

  const payload = await requestJson(`${settings.apiUrl}/services/shipment/order`, {
    carrier: CODE,
    headers: headers(settings),
    body: {
      products: (input.items || []).map((item) => ({
        name: item.name || 'Sản phẩm',
        product_code: item.sku || undefined,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.priceVnd) || 0),
        weight: Math.max(1, Number(item.weightGram) || 200) / 1_000,
      })),
      order: {
        id: input.orderRef,
        name: input.toName,
        phone: input.toPhone,
        address: input.toAddress,
        province: input.toProvince || '',
        district: input.toDistrict || '',
        ward: input.toWard || '',
        pick_money: Math.max(0, Math.round(Number(input.codVnd) || 0)),
        value: Math.max(0, Math.round(Number(input.codVnd) || 0)),
        is_freeship: 1,
      },
    },
  });

  const trackingCode = payload?.order?.label;
  if (!trackingCode) {
    return {
      trackingCode: buildTrackingCode(CODE, input.orderRef),
      expectedDeliveryAt: expectedDeliveryAt(input.method),
      mode: 'live',
    };
  }
  return { trackingCode, expectedDeliveryAt: expectedDeliveryAt(input.method), mode: 'live' };
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

  const payload = await requestJson(`${settings.apiUrl}/services/shipment/v2/${encodeURIComponent(trackingCode)}`, {
    carrier: CODE,
    method: 'GET',
    headers: headers(settings),
  });

  const order = payload?.order || {};
  const logs = Array.isArray(order.log) ? order.log : [];
  const events = logs.map((log) => ({
    at: log.created_at || new Date().toISOString(),
    status: STATUS_MAP[log.status] || SHIPMENT_STATUS.IN_TRANSIT,
    description: log.status_text || 'Cập nhật vận đơn.',
  }));
  const status = STATUS_MAP[order.status] || events.at(-1)?.status || SHIPMENT_STATUS.IN_TRANSIT;
  return { status, events, mode: 'live' };
}

/**
 * Chuẩn hóa payload webhook GHTK.
 * @param {unknown} body
 * @returns {{ trackingCode: string | null, status: string | null, description: string | null, location: string | null, occurredAt: string | null }}
 */
export function parseWebhook(body = {}) {
  const raw = body && typeof body === 'object' ? body : {};
  const statusId = raw.status_id ?? raw.order?.status;
  const trackingCode = raw.label_id ?? raw.order?.label ?? raw.partner_id ?? null;
  return {
    trackingCode: trackingCode ? String(trackingCode) : null,
    status: STATUS_MAP[statusId] || null,
    description: raw.status_text ?? raw.status ?? raw.action ?? null,
    location: raw.address ?? null,
    occurredAt: parseTimestamp(raw.updated_at ?? raw.action_time ?? raw.created_at),
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

  const payload = await requestJson(
    `${settings.apiUrl}/services/shipment/cancel/${encodeURIComponent(trackingCode)}`,
    { carrier: CODE, headers: headers(settings) },
  );
  return { cancelled: Boolean(payload?.success), mode: 'live' };
}
