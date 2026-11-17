import 'server-only';

/**
 * [SERVER] Adapter chuyển khoản ngân hàng qua VietQR (M05-F04, M05-F07).
 * - Không gọi API ngân hàng: QR do VietQR sinh từ BIN + số tài khoản + số tiền + nội dung.
 * - Mã đơn nằm trong nội dung chuyển khoản để webhook/nhân viên đối chiếu.
 * - Xác nhận tiền vào bằng webhook SePay/Casso (tùy chọn) hoặc nhân viên xác nhận tay.
 */
import { timingSafeEqual } from 'node:crypto';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getBankTransferEnv } from '@/server/env.js';

const VIETQR_IMAGE_BASE = 'https://img.vietqr.io/image';
const VIETQR_TEMPLATE = 'compact2';
const DEFAULT_TIMEOUT_MINUTES = 60;
const MIN_TIMEOUT_MINUTES = 5;
const MAX_TIMEOUT_MINUTES = 7 * 24 * 60;
// Mã đơn dạng KD-YYMMDD-XXXXXX; ngân hàng hay chèn khoảng trắng/dấu chấm vào nội dung.
const ORDER_REF_PATTERN = /KD[\s._-]*(\d{6})[\s._-]*([A-Z0-9]{6})/i;

function normalizeTimeoutMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return DEFAULT_TIMEOUT_MINUTES;
  return Math.min(MAX_TIMEOUT_MINUTES, Math.max(MIN_TIMEOUT_MINUTES, Math.round(minutes)));
}

/**
 * Phương thức chuyển khoản có sẵn sàng dùng không (đủ BIN + số tài khoản + tên chủ tài khoản).
 * @returns {boolean}
 */
export function isBankTransferConfigured() {
  return getBankTransferEnv().configured;
}

/**
 * Hạn giữ tồn cho đơn chuyển khoản — mặc định 60 phút vì tiền về chậm hơn ví điện tử.
 * @returns {number} số phút
 */
export function getBankTransferTimeoutMinutes() {
  const { values } = getBankTransferEnv();
  return normalizeTimeoutMinutes(values.timeoutMinutes);
}

/**
 * Cấu hình nhận tiền đã kiểm tra đầy đủ.
 * @returns {{
 *   bankBin: string,
 *   bankName: string,
 *   accountNo: string,
 *   accountName: string,
 *   webhookSecret: string | null,
 *   timeoutMinutes: number,
 *   mode: 'bank',
 * }}
 */
export function getBankTransferSettings() {
  const { values, configured } = getBankTransferEnv();
  if (!configured) {
    throw new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Chưa cấu hình tài khoản nhận chuyển khoản ngân hàng.',
      { details: { reason: 'BANK_TRANSFER_NOT_CONFIGURED', provider: 'BANK_TRANSFER' } },
    );
  }

  return {
    bankBin: String(values.bankBin),
    bankName: String(values.bankName ?? values.bankBin),
    accountNo: String(values.accountNo).replace(/\s+/g, ''),
    accountName: String(values.accountName),
    webhookSecret: values.webhookSecret ?? null,
    timeoutMinutes: normalizeTimeoutMinutes(values.timeoutMinutes),
    mode: 'bank',
  };
}

/**
 * Nội dung chuyển khoản = mã đơn để đối chiếu tự động.
 * @param {string} orderRef
 * @returns {string}
 */
export function buildTransferMemo(orderRef) {
  return String(orderRef ?? '').trim().toUpperCase();
}

/**
 * Ảnh VietQR động (amount + addInfo) để khách quét bằng app ngân hàng.
 * @param {{ amountVnd?: number, memo?: string }} input
 * @returns {string}
 */
export function buildVietQrUrl({ amountVnd, memo } = {}) {
  const settings = getBankTransferSettings();
  const query = new URLSearchParams();
  const amount = Math.round(Number(amountVnd ?? 0));
  if (amount > 0) query.set('amount', String(amount));
  if (memo) query.set('addInfo', String(memo));
  query.set('accountName', settings.accountName);

  return `${VIETQR_IMAGE_BASE}/${settings.bankBin}-${settings.accountNo}-${VIETQR_TEMPLATE}.png?${query.toString()}`;
}

/**
 * Tìm mã đơn trong nội dung chuyển khoản ngân hàng.
 * @param {string} content
 * @returns {string | null}
 */
export function parseOrderRefFromContent(content) {
  const match = ORDER_REF_PATTERN.exec(String(content ?? ''));
  if (!match) return null;
  return `KD-${match[1]}-${match[2].toUpperCase()}`;
}

/**
 * So sánh header Authorization của webhook với secret đã cấu hình.
 * Chấp nhận "Apikey <secret>" (SePay), "Bearer <secret>" hoặc chuỗi secret trần.
 * @param {string | null | undefined} headerValue
 * @param {string | null | undefined} secret
 * @returns {boolean}
 */
export function verifyWebhookSecret(headerValue, secret) {
  if (!headerValue || !secret) return false;
  const raw = String(headerValue).trim();
  const candidates = [
    raw,
    raw.replace(/^apikey\s+/i, ''),
    raw.replace(/^bearer\s+/i, ''),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  const expected = Buffer.from(String(secret));
  return candidates.some((candidate) => {
    const given = Buffer.from(candidate);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/**
 * Chuẩn hóa payload webhook chuyển khoản (SePay/Casso) về một dạng chung.
 * @param {unknown} body
 * @returns {{
 *   transferType: string | null,
 *   amountVnd: number,
 *   content: string,
 *   referenceCode: string | null,
 *   raw: unknown,
 * }}
 */
export function extractBankTransferEvent(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const amountRaw = source.transferAmount ?? source.amount ?? 0;
  const amountVnd = Math.round(Number(amountRaw));
  const content = [source.content, source.description, source.code]
    .filter((part) => part !== undefined && part !== null && part !== '')
    .join(' ');
  const reference = source.referenceCode ?? source.reference_code ?? null;

  return {
    transferType: source.transferType ? String(source.transferType) : null,
    amountVnd: Number.isFinite(amountVnd) ? amountVnd : 0,
    content,
    referenceCode:
      reference !== null && reference !== undefined
        ? String(reference)
        : source.id !== undefined && source.id !== null
          ? `BANK-${source.id}`
          : null,
    raw: source,
  };
}
