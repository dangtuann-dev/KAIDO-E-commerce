import 'server-only';

/**
 * [SERVER] Cổng điều phối ĐVVC (M06).
 * SRS: M06-F08..F11 | API-M06-01..04
 * Chọn adapter theo mã hãng, chuẩn hóa lỗi và xác thực chữ ký webhook.
 */
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { CARRIER_CODE_VALUES } from '@/shared/constants/shipping.js';
import { getCarrierStatus, getCarrierWebhookSecret } from '@/server/env.js';
import { AppError } from '@/server/http/errors.js';
import { verifySignature } from '@/server/security/verifySignature.js';
import * as ghn from './ghn.js';
import * as ghtk from './ghtk.js';
import * as viettelpost from './viettelpost.js';

const ADAPTERS = Object.freeze({
  GHN: ghn,
  GHTK: ghtk,
  VIETTELPOST: viettelpost,
});

/**
 * @param {string} carrierCode
 * @returns {typeof ghn}
 */
export function getCarrierAdapter(carrierCode) {
  const adapter = ADAPTERS[carrierCode];
  if (!adapter) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Đơn vị vận chuyển "${carrierCode}" không hợp lệ.`, {
      details: { allowed: CARRIER_CODE_VALUES },
    });
  }
  return adapter;
}

/**
 * Trạng thái từng hãng cho UI chọn ĐVVC.
 * @returns {Array<{ code: string, configured: boolean, mode: 'live' | 'simulation' }>}
 */
export function listCarrierStatuses() {
  const status = getCarrierStatus();
  return CARRIER_CODE_VALUES.map((code) => ({
    code,
    configured: Boolean(status[code]),
    mode: status[code] ? 'live' : 'simulation',
  }));
}

/**
 * Tính phí vận chuyển qua hãng.
 * @param {{ carrierCode: string } & Record<string, unknown>} input
 */
export async function calculateCarrierFee(input) {
  const { carrierCode, ...rest } = input;
  return getCarrierAdapter(carrierCode).calculateFee(rest);
}

/**
 * Tạo vận đơn qua hãng.
 * @param {{ carrierCode: string } & Record<string, unknown>} input
 */
export async function createCarrierShipment(input) {
  const { carrierCode, ...rest } = input;
  return getCarrierAdapter(carrierCode).createShipment(rest);
}

/**
 * Tra cứu trạng thái vận đơn.
 * @param {{ carrierCode: string, trackingCode: string, createdAt?: string }} input
 */
export async function getCarrierTracking(input) {
  const adapter = getCarrierAdapter(input.carrierCode);
  return adapter.getTracking(input.trackingCode, { createdAt: input.createdAt });
}

/**
 * Chuẩn hóa payload webhook của hãng về dạng chung.
 * @param {{ carrierCode: string, body: unknown }} input
 * @returns {{ trackingCode: string | null, status: string | null, description: string | null, location: string | null, occurredAt: string | null }}
 */
export function parseCarrierWebhook(input) {
  return getCarrierAdapter(input.carrierCode).parseWebhook(input.body);
}

/**
 * Hủy vận đơn.
 * @param {{ carrierCode: string, trackingCode: string }} input
 */
export async function cancelCarrierShipment(input) {
  return getCarrierAdapter(input.carrierCode).cancelShipment(input.trackingCode);
}

function readHeader(headers, names) {
  if (!headers) return null;
  for (const name of names) {
    const value = typeof headers.get === 'function' ? headers.get(name) : headers[name];
    if (value) return String(value);
  }
  return null;
}

/**
 * Xác thực chữ ký webhook của ĐVVC.
 * - Có khóa bí mật: so sánh HMAC-SHA256 (hex hoặc base64).
 * - Chưa có khóa: chỉ chấp nhận khi đang ở chế độ mô phỏng; production trả invalid.
 * @param {{ carrierCode: string, rawBody: string | Buffer, headers?: Headers | Record<string, string> }} input
 * @returns {{ valid: boolean, simulated: boolean, reason: string | null }}
 */
export function verifyCarrierWebhook(input) {
  const adapter = getCarrierAdapter(input.carrierCode);
  const secret = getCarrierWebhookSecret(adapter.CODE);
  const signature = readHeader(input.headers, [
    'x-carrier-signature',
    `x-${String(adapter.CODE).toLowerCase()}-signature`,
    'x-signature',
  ]);

  if (!secret) {
    const simulated = getCarrierStatus().simulationAllowed;
    return {
      valid: simulated,
      simulated,
      reason: simulated ? null : 'WEBHOOK_SECRET_NOT_CONFIGURED',
    };
  }

  if (!signature) {
    return { valid: false, simulated: false, reason: 'MISSING_SIGNATURE' };
  }

  const payload = input.rawBody;
  const ok =
    verifySignature({ payload, signature, secret, algorithm: 'sha256', encoding: 'hex' }) ||
    verifySignature({ payload, signature, secret, algorithm: 'sha256', encoding: 'base64' });

  return { valid: ok, simulated: false, reason: ok ? null : 'INVALID_SIGNATURE' };
}
