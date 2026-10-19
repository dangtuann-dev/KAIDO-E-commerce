import 'server-only';

/**
 * [SERVER] Cổng thanh toán VNPAY — interface + stub.
 * SRS: M05-F04 (tích hợp VNPAY, HMAC-SHA512), M05-F07 (IPN idempotency) | API: API-M05-04
 * Trạng thái: TODO
 * Việc cần làm: ký URL thanh toán, xác thực IPN/return, đối soát và hoàn tiền.
 * Owner: (xem docs/MODULES.md)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ orderRef: string, amountVnd: number, orderInfo: string, ipAddress: string, locale?: string }} _input
 * @returns {Promise<{ paymentUrl: string }>}
 */
export async function createPaymentUrl(_input) {
  // TODO(M05-F04): dựng URL VNPAY với vnp_SecureHash HMAC-SHA512 theo tài liệu cổng.
  throw new NotImplementedError('M05-F04', 'Cổng VNPAY chưa được tích hợp.');
}

/**
 * @param {Record<string, string>} _query
 * @returns {Promise<{ valid: boolean, orderRef: string, transactionRef: string, amountVnd: number, responseCode: string }>}
 */
export async function verifyIpn(_query) {
  // TODO(M05-F07): kiểm tra chữ ký, xử lý idempotent theo payment_transactions.provider_transaction_id.
  throw new NotImplementedError('M05-F07', 'Xử lý IPN VNPAY chưa được triển khai.');
}

/**
 * @param {Record<string, string>} _query
 * @returns {Promise<{ valid: boolean, orderRef: string, responseCode: string }>}
 */
export async function verifyReturn(_query) {
  // TODO(M05-F04): xác thực chữ ký tham số return trước khi hiển thị kết quả.
  throw new NotImplementedError('M05-F04', 'Xác thực return VNPAY chưa được triển khai.');
}

/**
 * @param {{ transactionRef: string, amountVnd: number, reason: string }} _input
 * @returns {Promise<{ refunded: boolean }>}
 */
export async function refund(_input) {
  // TODO(M05-F04): gọi API hoàn tiền và ghi log giao dịch độc lập.
  throw new NotImplementedError('M05-F04', 'Hoàn tiền VNPAY chưa được triển khai.');
}
