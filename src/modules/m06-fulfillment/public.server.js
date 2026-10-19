import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M06 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M06-F03 — Vận đơn + sự kiện mới nhất cho M05/M01.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getShipmentByOrder(_orderRef) {
  throw new NotImplementedError('M06-F03');
}

/**
 * M06-F10 — Điểm vào duy nhất để webhook ĐVVC đổi trạng thái.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function updateOrderStatusFromShipment(_orderId, _status) {
  throw new NotImplementedError('M06-F10');
}

/**
 * M06-F12 — Yêu cầu đổi trả của một đơn.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function listReturnRequestsForOrder(_orderRef) {
  throw new NotImplementedError('M06-F12');
}
