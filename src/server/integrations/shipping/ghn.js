import 'server-only';

/**
 * [SERVER] Đơn vị vận chuyển GHN — interface + stub.
 * SRS: M06-F08 (biểu phí), M06-F09 (tạo vận đơn), M06-F10 (webhook) | API-M06-01..04
 * Trạng thái: TODO
 * Việc cần làm: tính phí, tạo vận đơn, tra cứu, hủy vận đơn.
 * Owner: Tuann (M06)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ toDistrictId: number, toWardCode: string, weightGram: number, insuranceValueVnd: number }} _input
 * @returns {Promise<{ feeVnd: number, serviceName: string }>}
 */
export async function calculateFee(_input) {
  // TODO(M06-F08): gọi API phí GHN, đối chiếu shipping_fee_rules trong DB.
  throw new NotImplementedError('M06-F08', 'Tính phí GHN chưa được triển khai.');
}

/**
 * @param {{ orderRef: string, toName: string, toPhone: string, toAddress: string, weightGram: number, items: unknown[] }} _input
 * @returns {Promise<{ trackingCode: string, expectedDeliveryAt: string }>}
 */
export async function createShipment(_input) {
  // TODO(M06-F09): tạo vận đơn GHN, lưu mã bưu kiện vào shipments.
  throw new NotImplementedError('M06-F09', 'Tạo vận đơn GHN chưa được triển khai.');
}

/**
 * @param {string} _trackingCode
 * @returns {Promise<{ status: string, events: Array<{ at: string, description: string }> }>}
 */
export async function getTracking(_trackingCode) {
  // TODO(API-M06-03): tra cứu trạng thái GHN.
  throw new NotImplementedError('API-M06-03', 'Tra cứu vận đơn GHN chưa được triển khai.');
}

/**
 * @param {string} _trackingCode
 * @returns {Promise<{ cancelled: boolean }>}
 */
export async function cancelShipment(_trackingCode) {
  // TODO(M06-F09): hủy vận đơn khi đơn hàng bị hủy.
  throw new NotImplementedError('M06-F09', 'Hủy vận đơn GHN chưa được triển khai.');
}
