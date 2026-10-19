import 'server-only';

/**
 * [SERVER] Đơn vị vận chuyển GHTK — interface + stub.
 * SRS: M06-F08 (biểu phí), M06-F09 (tạo vận đơn), M06-F10 (webhook) | API-M06-01..04
 * Trạng thái: TODO
 * Việc cần làm: tính phí, tạo vận đơn, tra cứu, hủy vận đơn.
 * Owner: Tuann (M06)
 */
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * @param {{ toProvince: string, toDistrict: string, weightGram: number, valueVnd: number }} _input
 * @returns {Promise<{ feeVnd: number, serviceName: string }>}
 */
export async function calculateFee(_input) {
  // TODO(M06-F08): gọi API phí GHTK.
  throw new NotImplementedError('M06-F08', 'Tính phí GHTK chưa được triển khai.');
}

/**
 * @param {{ orderRef: string, toName: string, toPhone: string, toAddress: string, weightGram: number, items: unknown[] }} _input
 * @returns {Promise<{ trackingCode: string, expectedDeliveryAt: string }>}
 */
export async function createShipment(_input) {
  // TODO(M06-F09): tạo vận đơn GHTK, lưu mã bưu kiện vào shipments.
  throw new NotImplementedError('M06-F09', 'Tạo vận đơn GHTK chưa được triển khai.');
}

/**
 * @param {string} _trackingCode
 * @returns {Promise<{ status: string, events: Array<{ at: string, description: string }> }>}
 */
export async function getTracking(_trackingCode) {
  // TODO(API-M06-03): tra cứu trạng thái GHTK.
  throw new NotImplementedError('API-M06-03', 'Tra cứu vận đơn GHTK chưa được triển khai.');
}

/**
 * @param {string} _trackingCode
 * @returns {Promise<{ cancelled: boolean }>}
 */
export async function cancelShipment(_trackingCode) {
  // TODO(M06-F09): hủy vận đơn GHTK.
  throw new NotImplementedError('M06-F09', 'Hủy vận đơn GHTK chưa được triển khai.');
}
