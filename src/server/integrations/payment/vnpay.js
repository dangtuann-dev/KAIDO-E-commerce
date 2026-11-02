import 'server-only';

/**
 * [SERVER] Cổng thanh toán VNPAY — ký URL, xác thực IPN/return (M05-F04, M05-F07).
 * SRS: M05-F04 (tạo URL + HMAC-SHA512), M05-F07 (IPN idempotency) | API: API-M05-04
 *
 * Hai chế độ:
 *  - `live`: có VNPAY_TMN_CODE + VNPAY_HASH_SECRET → ký và xác thực bằng khóa thật.
 *  - `sandbox`: thiếu khóa và NODE_ENV !== 'production' → dùng khóa mô phỏng nội bộ,
 *    URL thanh toán trỏ về trang /checkout/payment-sandbox để demo toàn luồng IPN.
 * Ở production thiếu khóa, mọi lời gọi đều ném SERVICE_UNAVAILABLE (không có sandbox).
 */
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import {
  getPaymentGatewayEnv,
  getSiteUrl,
  isPaymentSandboxAllowed,
} from '@/server/env.js';
import { AppError, NotImplementedError } from '@/server/http/errors.js';
import { computeHmac, verifySignature } from '@/server/security/verifySignature.js';

const VNPAY_VERSION = '2.1.0';
const VNPAY_COMMAND = 'pay';
const VNPAY_CURRENCY = 'VND';
const VNPAY_ORDER_TYPE = 'other';
const VNPAY_HASH_ALGORITHM = 'sha512';
const VNPAY_DEFAULT_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_SIGNATURE_FIELD = 'vnp_SecureHash';
const VNPAY_SIGNATURE_TYPE_FIELD = 'vnp_SecureHashType';
const SANDBOX_TMN_CODE = 'KAIDOSBX';
const SANDBOX_HASH_SECRET = 'kaido-vnpay-sandbox-secret';
const SANDBOX_PAYMENT_PATH = '/checkout/payment-sandbox';
const VNPAY_TIME_OFFSET_MS = 7 * 60 * 60 * 1000;
const MAX_ORDER_INFO_LENGTH = 250;

function unavailable(message, details) {
  return new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, message, { details });
}

/**
 * Cấu hình VNPAY đã chuẩn hóa.
 * @returns {{
 *   mode: 'live' | 'sandbox',
 *   tmnCode: string,
 *   hashSecret: string,
 *   paymentUrl: string,
 *   returnUrl: string,
 *   ipnUrl: string | null,
 * }}
 */
export function getVnpaySettings() {
  const { values, configured } = getPaymentGatewayEnv('VNPAY');
  const siteUrl = getSiteUrl();

  if (configured) {
    return {
      mode: 'live',
      tmnCode: values.tmnCode,
      hashSecret: values.hashSecret,
      paymentUrl: values.paymentUrl || VNPAY_DEFAULT_PAYMENT_URL,
      returnUrl: values.returnUrl || `${siteUrl}/payment/vnpay-return`,
      ipnUrl: values.ipnUrl || `${siteUrl}/api/v1/payments/vnpay/ipn`,
    };
  }

  if (!isPaymentSandboxAllowed()) {
    throw unavailable(
      'Cổng thanh toán VNPAY chưa được cấu hình. Vui lòng chọn thanh toán khi nhận hàng (COD).',
      { reason: 'VNPAY_NOT_CONFIGURED', provider: 'VNPAY' },
    );
  }

  return {
    mode: 'sandbox',
    tmnCode: SANDBOX_TMN_CODE,
    hashSecret: SANDBOX_HASH_SECRET,
    paymentUrl: `${siteUrl}${SANDBOX_PAYMENT_PATH}`,
    returnUrl: `${siteUrl}/payment/vnpay-return`,
    ipnUrl: `${siteUrl}/api/v1/payments/vnpay/ipn`,
  };
}

/** True khi VNPAY đang chạy ở chế độ mô phỏng nội bộ. */
export function isSandboxMode() {
  return getVnpaySettings().mode === 'sandbox';
}

/** Bỏ dấu tiếng Việt để nội dung đơn hàng gửi cổng không lỗi font. */
function toAscii(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Múi giờ VNPAY yêu cầu là GMT+7, định dạng yyyyMMddHHmmss.
 * @param {Date} [date]
 */
function formatVnpayTime(date = new Date()) {
  const shifted = new Date(date.getTime() + VNPAY_TIME_OFFSET_MS);
  const pad = (value) => String(value).padStart(2, '0');
  return [
    shifted.getUTCFullYear(),
    pad(shifted.getUTCMonth() + 1),
    pad(shifted.getUTCDate()),
    pad(shifted.getUTCHours()),
    pad(shifted.getUTCMinutes()),
    pad(shifted.getUTCSeconds()),
  ].join('');
}

/**
 * Chuỗi canonical VNPAY: sắp xếp khóa tăng dần, encode từng khóa và giá trị.
 * @param {Record<string, string>} params
 */
function buildCanonicalString(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
}

/**
 * @param {Record<string, string>} params
 * @param {string} secret
 * @returns {string} HMAC-SHA512 dạng hex (chữ thường).
 */
export function buildSecureHash(params, secret) {
  return computeHmac(buildCanonicalString(params), secret, {
    algorithm: VNPAY_HASH_ALGORITHM,
    encoding: 'hex',
  });
}

/**
 * Tạo URL thanh toán VNPAY.
 * @param {{
 *   orderRef: string,
 *   amountVnd: number,
 *   orderInfo: string,
 *   ipAddress?: string,
 *   locale?: 'vn' | 'en',
 *   expiresAt?: string | Date | null,
 * }} input
 * @returns {Promise<{ paymentUrl: string, provider: 'VNPAY', mode: 'live' | 'sandbox', sandbox: boolean }>}
 */
export async function createPaymentUrl(input) {
  const { orderRef, amountVnd, orderInfo, ipAddress, locale, expiresAt } = input ?? {};
  if (!orderRef) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Thiếu mã đơn hàng khi tạo URL VNPAY.');
  }
  if (!Number.isFinite(Number(amountVnd)) || Number(amountVnd) <= 0) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Số tiền thanh toán không hợp lệ.');
  }

  const settings = getVnpaySettings();

  if (settings.mode === 'sandbox') {
    const url = `${settings.paymentUrl.replace(/\/$/, '')}/${encodeURIComponent(orderRef)}`;
    return {
      paymentUrl: url,
      provider: 'VNPAY',
      mode: 'sandbox',
      sandbox: true,
    };
  }

  const now = new Date();
  const params = {
    vnp_Version: VNPAY_VERSION,
    vnp_Command: VNPAY_COMMAND,
    vnp_TmnCode: settings.tmnCode,
    vnp_Amount: String(Math.round(Number(amountVnd)) * 100),
    vnp_CurrCode: VNPAY_CURRENCY,
    vnp_TxnRef: orderRef,
    vnp_OrderInfo: toAscii(orderInfo || `Thanh toan don hang ${orderRef}`).slice(
      0,
      MAX_ORDER_INFO_LENGTH,
    ),
    vnp_OrderType: VNPAY_ORDER_TYPE,
    vnp_Locale: locale === 'en' ? 'en' : 'vn',
    vnp_ReturnUrl: settings.returnUrl,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_CreateDate: formatVnpayTime(now),
  };

  if (expiresAt) {
    const expireDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (!Number.isNaN(expireDate.getTime()) && expireDate.getTime() > now.getTime()) {
      params.vnp_ExpireDate = formatVnpayTime(expireDate);
    }
  }

  const secureHash = buildSecureHash(params, settings.hashSecret);
  const query = buildCanonicalString({ ...params, [VNPAY_SIGNATURE_FIELD]: secureHash });

  return {
    paymentUrl: `${settings.paymentUrl}?${query}`,
    provider: 'VNPAY',
    mode: 'live',
    sandbox: false,
  };
}

/**
 * Tách chữ ký ra khỏi tham số trước khi tính lại HMAC.
 * @param {Record<string, unknown>} payload
 */
function stripSignature(payload) {
  const params = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (key === VNPAY_SIGNATURE_FIELD || key === VNPAY_SIGNATURE_TYPE_FIELD) continue;
    if (value === undefined || value === null) continue;
    params[key] = String(value);
  }
  return params;
}

function assertSignature(payload, settings, label) {
  const signature = payload?.[VNPAY_SIGNATURE_FIELD];
  const params = stripSignature(payload);
  const valid = verifySignature({
    payload: buildCanonicalString(params),
    signature: typeof signature === 'string' ? signature : '',
    secret: settings.hashSecret,
    algorithm: VNPAY_HASH_ALGORITHM,
    encoding: 'hex',
  });

  if (!valid) {
    return { valid: false, params, reason: `${label}_INVALID_SIGNATURE` };
  }
  return { valid: true, params, reason: null };
}

/**
 * Chuẩn hóa dữ liệu VNPAY trả về (IPN và return dùng chung cấu trúc).
 * @param {Record<string, string>} params
 */
function toPaymentResult(params) {
  const amount = Number(params.vnp_Amount ?? 0) / 100;
  return {
    orderRef: params.vnp_TxnRef ?? null,
    transactionRef: params.vnp_TransactionNo ?? null,
    amountVnd: Number.isFinite(amount) ? amount : 0,
    responseCode: params.vnp_ResponseCode ?? null,
    transactionStatus: params.vnp_TransactionStatus ?? null,
    bankCode: params.vnp_BankCode ?? null,
    payDate: params.vnp_PayDate ?? null,
    cardType: params.vnp_CardType ?? null,
    message: params.vnp_Message ?? params.vnp_OrderInfo ?? null,
    raw: params,
  };
}

/**
 * Xác thực IPN (server-to-server).
 * @param {Record<string, string>} query
 * @returns {Promise<{
 *   valid: boolean,
 *   reason: string | null,
 *   mode: 'live' | 'sandbox',
 *   orderRef: string | null,
 *   transactionRef: string | null,
 *   amountVnd: number,
 *   responseCode: string | null,
 *   isSuccess: boolean,
 *   result: ReturnType<typeof toPaymentResult> | null,
 * }>}
 */
export async function verifyIpn(query) {
  const settings = getVnpaySettings();
  const { valid, params, reason } = assertSignature(query, settings, 'VNPAY_IPN');

  if (!valid) {
    return {
      valid: false,
      reason,
      mode: settings.mode,
      orderRef: null,
      transactionRef: null,
      amountVnd: 0,
      responseCode: null,
      isSuccess: false,
      result: null,
    };
  }

  const result = toPaymentResult(params);
  return {
    valid: true,
    reason: null,
    mode: settings.mode,
    ...result,
    isSuccess: result.responseCode === '00' && result.transactionStatus === '00',
    result,
  };
}

/**
 * Xác thực tham số return (người dùng bị chuyển hướng về website).
 * @param {Record<string, string>} query
 * @returns {Promise<{
 *   valid: boolean,
 *   reason: string | null,
 *   mode: 'live' | 'sandbox',
 *   orderRef: string | null,
 *   responseCode: string | null,
 *   isSuccess: boolean,
 *   amountVnd: number,
 *   result: ReturnType<typeof toPaymentResult> | null,
 * }>}
 */
export async function verifyReturn(query) {
  const settings = getVnpaySettings();
  const { valid, params, reason } = assertSignature(query, settings, 'VNPAY_RETURN');

  if (!valid) {
    return {
      valid: false,
      reason,
      mode: settings.mode,
      orderRef: null,
      responseCode: null,
      isSuccess: false,
      amountVnd: 0,
      result: null,
    };
  }

  const result = toPaymentResult(params);
  return {
    valid: true,
    reason: null,
    mode: settings.mode,
    orderRef: result.orderRef,
    responseCode: result.responseCode,
    isSuccess: result.responseCode === '00',
    amountVnd: result.amountVnd,
    result,
  };
}

/**
 * Dựng form mô phỏng IPN cho trang sandbox (chỉ dùng khi mode = sandbox).
 * Trả về `fields` đã ký để trang render thành form POST tới API-M05-04.
 * @param {{ orderRef: string, amountVnd: number, success?: boolean }} input
 * @returns {{ action: string, fields: Record<string, string>, mode: 'sandbox' }}
 */
export function buildSandboxSimulation(input) {
  const settings = getVnpaySettings();
  if (settings.mode !== 'sandbox') {
    throw unavailable('Trang mô phỏng thanh toán chỉ khả dụng khi chưa cấu hình cổng thật.', {
      reason: 'SANDBOX_DISABLED',
    });
  }

  const success = input?.success !== false;
  const now = new Date();
  const params = {
    vnp_Version: VNPAY_VERSION,
    vnp_Command: VNPAY_COMMAND,
    vnp_TmnCode: settings.tmnCode,
    vnp_Amount: String(Math.round(Number(input?.amountVnd ?? 0)) * 100),
    vnp_CurrCode: VNPAY_CURRENCY,
    vnp_TxnRef: String(input?.orderRef ?? ''),
    vnp_OrderInfo: toAscii(`Mo phong thanh toan ${input?.orderRef ?? ''}`).slice(
      0,
      MAX_ORDER_INFO_LENGTH,
    ),
    vnp_OrderType: VNPAY_ORDER_TYPE,
    vnp_Locale: 'vn',
    vnp_ReturnUrl: settings.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: formatVnpayTime(now),
    vnp_TransactionNo: `SBX${now.getTime()}`,
    vnp_TransactionStatus: success ? '00' : '24',
    vnp_ResponseCode: success ? '00' : '24',
    vnp_BankCode: 'NCB',
    vnp_CardType: 'ATM',
    vnp_PayDate: formatVnpayTime(now),
  };

  return {
    action: settings.ipnUrl || '/api/v1/payments/vnpay/ipn',
    mode: 'sandbox',
    fields: {
      ...params,
      [VNPAY_SIGNATURE_FIELD]: buildSecureHash(params, settings.hashSecret),
    },
  };
}

/**
 * @param {{ transactionRef: string, amountVnd: number, reason: string }} _input
 * @returns {Promise<{ refunded: boolean }>}
 */
export async function refund(_input) {
  // TODO(M05-F04): gọi API hoàn tiền VNPAY và ghi log giao dịch độc lập.
  throw new NotImplementedError('M05-F04', 'Hoàn tiền VNPAY chưa được triển khai.');
}
