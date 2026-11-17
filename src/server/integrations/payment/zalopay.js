import 'server-only';

/**
 * [SERVER] Cổng thanh toán ZaloPay (mô hình Cổng ZaloPay cho web).
 * SRS: M05-F04 (phương thức thanh toán trực tuyến), M05-F07 (callback idempotency)
 *
 * Luồng: tạo đơn (/v2/create, ký Key1) → redirect `order_url` → khách thanh toán
 * trên cổng → ZaloPay gọi callback (ký Key2) và redirect về kèm `checksum`.
 * Merchant dùng appid 554 công khai của ZaloPay cho môi trường sandbox.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getPaymentGatewayEnv, getSiteUrl } from '@/server/env.js';

const DEFAULT_CREATE_URL = 'https://sb-openapi.zalopay.vn/v2/create';
const DEFAULT_QUERY_URL = 'https://sb-openapi.zalopay.vn/v2/query';
const SANDBOX_APP_ID = '554';
const MAX_TRANS_ID_LENGTH = 40;
const MIN_EXPIRE_SECONDS = 300;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function serviceUnavailable(message, details) {
  return new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, message, { details });
}

function hmacSha256(input, key) {
  return createHmac('sha256', key).update(String(input), 'utf8').digest('hex');
}

function safeEqualHex(left, right) {
  const a = Buffer.from(String(left ?? ''), 'utf8');
  const b = Buffer.from(String(right ?? ''), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** yymmdd theo giờ Việt Nam (GMT+7) — ZaloPay yêu cầu tiền tố này cho app_trans_id. */
function vnDatePrefix(date = new Date()) {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  const yy = String(shifted.getUTCFullYear()).slice(-2);
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Cấu hình ZaloPay. Thiếu khóa thì ném 503 để module M05 hạ cấp sang COD.
 * @returns {{ appId: string, key1: string, key2: string, createUrl: string, queryUrl: string, redirectUrl: string, callbackUrl: string, sandbox: boolean, mode: 'live' }}
 */
export function getZalopaySettings() {
  const { values, configured } = getPaymentGatewayEnv('ZALOPAY');
  if (!configured) {
    throw serviceUnavailable(
      'Cổng ZaloPay chưa được cấu hình. Vui lòng chọn thanh toán khi nhận hàng (COD).',
      { reason: 'ZALOPAY_NOT_CONFIGURED', provider: 'ZALOPAY' },
    );
  }

  const appId = String(values.appId);
  const siteUrl = getSiteUrl();

  return {
    appId,
    key1: values.key1,
    key2: values.key2,
    createUrl: values.endpoint || DEFAULT_CREATE_URL,
    queryUrl: DEFAULT_QUERY_URL,
    redirectUrl: `${siteUrl}/payment/zalopay-return`,
    callbackUrl: `${siteUrl}/api/v1/payments/zalopay/callback`,
    sandbox: appId === SANDBOX_APP_ID,
    mode: 'live',
  };
}

/** True khi đang dùng appid sandbox công khai của ZaloPay. */
export function isZalopaySandbox() {
  try {
    return getZalopaySettings().sandbox;
  } catch {
    return false;
  }
}

/**
 * app_trans_id = yymmdd_appid_<mã đơn>, tối đa 40 ký tự và duy nhất mỗi đơn.
 * @param {string} orderRef
 * @param {Date} [date]
 */
export function buildAppTransId(orderRef, date = new Date()) {
  const settings = getZalopaySettings();
  const suffix = String(orderRef ?? '').replace(/[^A-Za-z0-9_-]/g, '');
  const value = `${vnDatePrefix(date)}_${settings.appId}_${suffix}`.slice(0, MAX_TRANS_ID_LENGTH);
  return value;
}

/** Lấy lại mã đơn KAIDO từ app_trans_id. */
export function parseOrderRefFromAppTransId(appTransId) {
  const match = /^\d{6}_\d+_(.+)$/.exec(String(appTransId ?? ''));
  return match ? match[1] : null;
}

/**
 * M05-F04 — Tạo đơn ZaloPay và trả link cổng thanh toán.
 * @param {{
 *   orderRef: string,
 *   amountVnd: number,
 *   description?: string,
 *   appUser?: string,
 *   preferredMethods?: string[],
 *   expiresInSeconds?: number,
 * }} input
 * @returns {Promise<{ paymentUrl: string, transactionRef: string|null, appTransId: string, mode: 'live', sandbox: boolean }>}
 */
export async function createOrder(input) {
  const settings = getZalopaySettings();
  const orderRef = input?.orderRef;
  const amount = Math.round(Number(input?.amountVnd));
  if (!orderRef) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Thiếu mã đơn hàng khi tạo giao dịch ZaloPay.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Số tiền thanh toán không hợp lệ.');
  }

  const appTransId = buildAppTransId(orderRef);
  const appTime = Date.now();
  const appUser = String(input?.appUser ?? 'kaido').slice(0, 50);
  const embedData = JSON.stringify({
    redirecturl: settings.redirectUrl,
    preferred_payment_method: Array.isArray(input?.preferredMethods) ? input.preferredMethods : [],
  });
  const item = JSON.stringify([]);
  const description = String(input?.description ?? `Thanh toan don hang ${orderRef}`).slice(0, 256);

  const mac = hmacSha256(
    [
      settings.appId,
      appTransId,
      appUser,
      amount,
      appTime,
      embedData,
      item,
    ].join('|'),
    settings.key1,
  );

  const payload = {
    app_id: Number(settings.appId),
    app_trans_id: appTransId,
    app_user: appUser,
    app_time: appTime,
    amount,
    description,
    item,
    embed_data: embedData,
    callback_url: settings.callbackUrl,
    mac,
  };

  if (Number.isFinite(input?.expiresInSeconds)) {
    const seconds = Math.round(Number(input.expiresInSeconds));
    if (seconds >= MIN_EXPIRE_SECONDS) payload.expire_duration_seconds = seconds;
  }

  const response = await fetch(settings.createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || Number(data.return_code) !== 1 || !data.order_url) {
    throw serviceUnavailable(
      data?.sub_return_message || data?.return_message || 'Cổng ZaloPay từ chối tạo giao dịch.',
      {
        reason: 'ZALOPAY_CREATE_FAILED',
        provider: 'ZALOPAY',
        return_code: data?.return_code ?? null,
        sub_return_code: data?.sub_return_code ?? null,
      },
    );
  }

  return {
    paymentUrl: data.order_url,
    transactionRef: data.zp_trans_token ?? null,
    appTransId,
    mode: 'live',
    sandbox: settings.sandbox,
  };
}

/**
 * M05-F07 — Xác thực callback ZaloPay: mac = HMAC_SHA256(data, Key2).
 * @param {{ body?: { data?: string, mac?: string, type?: number|string } }} input
 * @returns {Promise<{
 *   valid: boolean,
 *   reason: string | null,
 *   orderRef: string | null,
 *   appTransId: string | null,
 *   amountVnd: number,
 *   transactionRef: string | null,
 *   type: number | null,
 *   isSuccess: boolean,
 *   raw: Record<string, unknown> | null,
 * }>}
 */
export async function verifyCallback(input) {
  const settings = getZalopaySettings();
  const body = input?.body ?? {};
  const data = typeof body.data === 'string' ? body.data : '';
  const mac = typeof body.mac === 'string' ? body.mac : '';
  const type = body.type === undefined || body.type === null ? null : Number(body.type);

  const empty = {
    orderRef: null,
    appTransId: null,
    amountVnd: 0,
    transactionRef: null,
    raw: null,
  };

  if (!data || !mac || !safeEqualHex(hmacSha256(data, settings.key2), mac)) {
    return { valid: false, reason: 'ZALOPAY_CALLBACK_INVALID_MAC', type, isSuccess: false, ...empty };
  }

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return { valid: false, reason: 'ZALOPAY_CALLBACK_INVALID_DATA', type, isSuccess: false, ...empty };
  }

  const appTransId = parsed.app_trans_id ? String(parsed.app_trans_id) : null;
  return {
    valid: true,
    reason: null,
    orderRef: parseOrderRefFromAppTransId(appTransId),
    appTransId,
    amountVnd: Number(parsed.amount ?? 0),
    transactionRef: parsed.zp_trans_id ? String(parsed.zp_trans_id) : null,
    type,
    isSuccess: type === 1,
    raw: parsed,
  };
}

/**
 * Xác thực redirect từ cổng: checksum = HMAC_SHA256(appid|apptransid|pmcid|bankcode|amount|discountamount|status, Key2).
 * @param {Record<string, string>} query
 * @returns {Promise<{
 *   valid: boolean,
 *   reason: string | null,
 *   orderRef: string | null,
 *   amountVnd: number,
 *   status: string | null,
 *   isSuccess: boolean,
 *   raw: Record<string, string> | null,
 * }>}
 */
export async function verifyRedirect(query) {
  const settings = getZalopaySettings();
  const params = query ?? {};
  const checksumInput = [
    params.appid ?? '',
    params.apptransid ?? '',
    params.pmcid ?? '',
    params.bankcode ?? '',
    params.amount ?? '',
    params.discountamount ?? '',
    params.status ?? '',
  ].join('|');

  const empty = { orderRef: null, amountVnd: 0, status: null, raw: null };
  if (!params.apptransid || !params.checksum) {
    return { valid: false, reason: 'ZALOPAY_REDIRECT_MISSING', isSuccess: false, ...empty };
  }

  if (!safeEqualHex(hmacSha256(checksumInput, settings.key2), params.checksum)) {
    return { valid: false, reason: 'ZALOPAY_REDIRECT_INVALID_CHECKSUM', isSuccess: false, ...empty };
  }

  const status = params.status ? String(params.status) : null;
  return {
    valid: true,
    reason: null,
    orderRef: parseOrderRefFromAppTransId(params.apptransid),
    amountVnd: Number(params.amount ?? 0),
    status,
    isSuccess: status === '1',
    raw: params,
  };
}

/**
 * Truy vấn trạng thái đơn (dùng khi callback không về). mac = HMAC_SHA256(app_id|app_trans_id|key1, key1).
 * @param {{ appTransId: string }} input
 * @returns {Promise<{ returnCode: number, isSuccess: boolean, amountVnd: number, transactionRef: string | null }>}
 */
export async function queryOrder(input) {
  const settings = getZalopaySettings();
  const appTransId = String(input?.appTransId ?? '');
  const mac = hmacSha256(`${settings.appId}|${appTransId}|${settings.key1}`, settings.key1);

  const response = await fetch(settings.queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: Number(settings.appId),
      app_trans_id: appTransId,
      mac,
    }),
  });

  const data = await response.json().catch(() => null);
  return {
    returnCode: Number(data?.return_code ?? -1),
    isSuccess: Number(data?.return_code) === 1,
    amountVnd: Number(data?.amount ?? 0),
    transactionRef: data?.zp_trans_id ? String(data.zp_trans_id) : null,
  };
}

/**
 * @param {{ transactionRef: string, amountVnd: number, description: string }} _input
 * @returns {Promise<{ refunded: boolean }>}
 */
export async function refund(_input) {
  throw new AppError(ERROR_CODES.NOT_IMPLEMENTED, 'Hoàn tiền ZaloPay chưa được triển khai.', {
    details: { feature: 'M05-F04', provider: 'ZALOPAY' },
  });
}
