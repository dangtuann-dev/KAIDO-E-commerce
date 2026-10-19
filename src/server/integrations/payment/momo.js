import 'server-only';

/**
 * [SERVER] Cổng thanh toán MoMo — interface + stub.
 * SRS: M05-F04 (MoMo Open API), M05-F07 (callback idempotency)
 * Trạng thái: TODO
 * Việc cần làm: tạo giao dịch, xác thực callback, hoàn tiền.
 * Owner: (xem docs/MODULES.md)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ orderRef: string, amountVnd: number, orderInfo: string, redirectUrl: string, ipnUrl: string }} _input
 * @returns {Promise<{ payUrl: string, deeplink?: string, requestId: string }>}
 */
export async function createPayment(_input) {
  // TODO(M05-F04): ký request MoMo và trả payUrl/deeplink.
  throw new NotImplementedError('M05-F04', 'Cổng MoMo chưa được tích hợp.');
}

/**
 * @param {Record<string, unknown>} _payload
 * @param {string} _signature
 * @returns {Promise<{ valid: boolean, orderRef: string, transactionRef: string, resultCode: number }>}
 */
export async function verifyCallback(_payload, _signature) {
  // TODO(M05-F07): xác thực HMAC và xử lý callback idempotent.
  throw new NotImplementedError('M05-F07', 'Xử lý callback MoMo chưa được triển khai.');
}

/**
 * @param {{ transactionRef: string, amountVnd: number, description: string }} _input
 * @returns {Promise<{ refunded: boolean }>}
 */
export async function refund(_input) {
  // TODO(M05-F04): gọi API hoàn tiền MoMo.
  throw new NotImplementedError('M05-F04', 'Hoàn tiền MoMo chưa được triển khai.');
}
