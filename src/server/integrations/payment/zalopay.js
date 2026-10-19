import 'server-only';

/**
 * [SERVER] Cổng thanh toán ZaloPay — interface + stub.
 * SRS: M05-F04 (phương thức thanh toán trực tuyến), M05-F07 (callback idempotency)
 * Trạng thái: TODO
 * Việc cần làm: tạo order, xác thực callback, hoàn tiền.
 * Owner: (xem docs/MODULES.md)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ orderRef: string, amountVnd: number, description: string, callbackUrl: string }} _input
 * @returns {Promise<{ orderUrl: string, zpTransToken: string }>}
 */
export async function createOrder(_input) {
  // TODO(M05-F04): ký request ZaloPay và trả orderUrl.
  throw new NotImplementedError('M05-F04', 'Cổng ZaloPay chưa được tích hợp.');
}

/**
 * @param {Record<string, unknown>} _payload
 * @param {string} _signature
 * @returns {Promise<{ valid: boolean, orderRef: string, transactionRef: string, returnCode: number }>}
 */
export async function verifyCallback(_payload, _signature) {
  // TODO(M05-F07): xác thực MAC và xử lý callback idempotent.
  throw new NotImplementedError('M05-F07', 'Xử lý callback ZaloPay chưa được triển khai.');
}

/**
 * @param {{ transactionRef: string, amountVnd: number, description: string }} _input
 * @returns {Promise<{ refunded: boolean }>}
 */
export async function refund(_input) {
  // TODO(M05-F04): gọi API hoàn tiền ZaloPay.
  throw new NotImplementedError('M05-F04', 'Hoàn tiền ZaloPay chưa được triển khai.');
}
