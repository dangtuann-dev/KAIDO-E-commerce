import 'server-only';

/**
 * [SERVER] Tiện ích dùng chung cho adapter ĐVVC (M06).
 * Gồm: gọi HTTP có timeout, sinh dữ liệu mô phỏng tất định, và lỗi chuẩn hóa.
 */
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { SHIPMENT_STATUS } from '@/shared/constants/shipping.js';
import { isCarrierSimulationAllowed } from '@/server/env.js';
import { AppError } from '@/server/http/errors.js';

const DEFAULT_TIMEOUT_MS = 10_000;
const WEIGHT_STEP_GRAM = 1_000;
const WEIGHT_STEP_FEE_VND = 5_000;
const EXPRESS_MULTIPLIER = 1.5;

export function carrierUnavailable(carrier, message, details) {
  return new AppError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    message || `Đơn vị vận chuyển ${carrier} chưa được cấu hình.`,
    { details: { carrier, ...(details || {}) } },
  );
}

/**
 * Khi chưa cấu hình hãng thật, chỉ cho phép mô phỏng ngoài production.
 */
export function assertSimulationAllowed(carrier) {
  if (!isCarrierSimulationAllowed()) {
    throw carrierUnavailable(
      carrier,
      `Đơn vị vận chuyển ${carrier} chưa được cấu hình. Vui lòng liên hệ quản trị viên.`,
      { reason: 'CARRIER_NOT_CONFIGURED' },
    );
  }
}

/**
 * Gọi JSON API của ĐVVC. Luôn có timeout và không làm lộ token trong lỗi.
 * @param {string} url
 * @param {{ method?: 'GET' | 'POST', headers?: Record<string, string>, body?: unknown, carrier: string }} options
 * @returns {Promise<any>}
 */
export async function requestJson(url, options) {
  const { carrier, method = 'POST', headers = {}, body } = options;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    throw carrierUnavailable(
      carrier,
      `Không kết nối được tới ${carrier}. Vui lòng thử lại sau.`,
      { reason: 'CARRIER_UNREACHABLE' },
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw carrierUnavailable(
      carrier,
      `${carrier} trả về lỗi ${response.status}.`,
      { reason: 'CARRIER_HTTP_ERROR', status: response.status },
    );
  }

  return payload;
}

/**
 * Chuẩn hóa mốc thời gian ĐVVC (epoch giây/ms hoặc chuỗi ISO).
 * @param {unknown} value
 * @returns {string | null}
 */
export function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const numeric = Number(value);
    const millis = numeric > 1e12 ? numeric : numeric * 1_000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Mã vận đơn mô phỏng tất định theo hãng + mã đơn.
 * @param {string} carrier
 * @param {string} orderRef
 */
export function buildTrackingCode(carrier, orderRef) {
  const sanitized = String(orderRef || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(-10);
  const suffix = sanitized || String(Date.now()).slice(-10);
  const prefix = carrier === 'VIETTELPOST' ? 'VTP' : carrier;
  return `${prefix}${suffix}`;
}

/**
 * Biểu phí mô phỏng, bám theo BUSINESS_RULES.SHIPPING.
 * @param {{ method?: 'STANDARD' | 'EXPRESS', weightGram?: number, innerCity?: boolean }} input
 */
export function simulateFee(input = {}) {
  const weight = Math.max(0, Number(input.weightGram) || 0);
  const base = input.innerCity
    ? BUSINESS_RULES.SHIPPING.INNER_CITY_FEE_VND
    : BUSINESS_RULES.SHIPPING.PROVINCE_FEE_MIN_VND;
  const extraSteps = weight > WEIGHT_STEP_GRAM ? Math.ceil((weight - WEIGHT_STEP_GRAM) / WEIGHT_STEP_GRAM) : 0;
  const weighted = base + extraSteps * WEIGHT_STEP_FEE_VND;
  const multiplier = input.method === 'EXPRESS' ? EXPRESS_MULTIPLIER : 1;
  return Math.round((weighted * multiplier) / 1_000) * 1_000;
}

/**
 * Thời điểm giao dự kiến: tiêu chuẩn +3 ngày, hỏa tốc +1 ngày.
 * @param {'STANDARD' | 'EXPRESS'} method
 * @param {Date} [from]
 */
export function expectedDeliveryAt(method, from = new Date()) {
  const days = method === 'EXPRESS' ? 1 : 3;
  const date = new Date(from.getTime());
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date.toISOString();
}

/**
 * Trạng thái mô phỏng theo thời gian trôi qua kể từ lúc tạo vận đơn.
 * Không truyền createdAt → coi như đang vận chuyển.
 * @param {{ trackingCode: string, createdAt?: string | Date | null }} input
 */
export function simulateTracking(input) {
  const createdAt = input?.createdAt ? new Date(input.createdAt) : null;
  const now = Date.now();
  const elapsedHours =
    createdAt && !Number.isNaN(createdAt.getTime()) ? (now - createdAt.getTime()) / 3_600_000 : Number.NaN;

  const timeline = [
    { afterHours: 0, status: SHIPMENT_STATUS.PENDING, description: 'Đã tạo vận đơn, chờ lấy hàng.' },
    { afterHours: 2, status: SHIPMENT_STATUS.PICKED_UP, description: 'Đơn vị vận chuyển đã lấy hàng.' },
    { afterHours: 12, status: SHIPMENT_STATUS.IN_TRANSIT, description: 'Hàng đang trên đường tới kho phân loại.' },
    { afterHours: 36, status: SHIPMENT_STATUS.OUT_FOR_DELIVERY, description: 'Đang giao hàng tới người nhận.' },
    { afterHours: 60, status: SHIPMENT_STATUS.DELIVERED, description: 'Giao hàng thành công.' },
  ];

  let current = timeline[2];
  if (Number.isNaN(elapsedHours)) {
    current = timeline[2];
  } else {
    current = timeline[0];
    for (const step of timeline) {
      if (elapsedHours >= step.afterHours) current = step;
    }
  }

  const stamp = (hours) => new Date(now - Math.max(0, (elapsedHours || 0) - hours) * 3_600_000).toISOString();
  const events = timeline
    .filter((step) => step.afterHours <= (Number.isNaN(elapsedHours) ? 12 : elapsedHours))
    .map((step) => ({ at: stamp(step.afterHours), status: step.status, description: step.description }));

  return { status: current.status, events };
}
