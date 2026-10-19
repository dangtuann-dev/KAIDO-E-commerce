import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M08 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M08-F04 — Tồn khả dụng cho M04/M05.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function checkAvailability(_skus) {
  throw new NotImplementedError('M08-F04');
}

/**
 * M08-F05 — Giữ tồn nguyên tử khi đặt hàng.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function reserveForOrder(_orderRef, _items) {
  throw new NotImplementedError('M08-F05');
}

/**
 * M08-F07 — Giải phóng tồn khi hủy/timeout.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function releaseForOrder(_orderRef) {
  throw new NotImplementedError('M08-F07');
}

/**
 * M08-F06 — Xuất kho khi tạo vận đơn.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function fulfillForOrder(_orderRef) {
  throw new NotImplementedError('M08-F06');
}
