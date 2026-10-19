import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * [SERVER] Hợp đồng công khai của M02 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */
/**
 * M02-F11 — Snapshot tên/SKU/giá/ảnh tại thời điểm đặt hàng (BR-M05-05).
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getProductSnapshot(_productId, _variantId) {
  throw new NotImplementedError('M02-F11');
}

/**
 * M02-F10 — Thông tin tối thiểu cho giỏ hàng/tìm kiếm.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function listProductSnapshots(_productIds) {
  throw new NotImplementedError('M02-F10');
}

/**
 * M02-F11 — Đồng bộ rating_avg/rating_count từ M10 (BR-M10-03).
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function updateProductRatingSummary(_productId, _summary) {
  throw new NotImplementedError('M02-F11');
}

/**
 * M02-F06 — Cập nhật cờ hết hàng khi M08 phát hiện available = 0 (BR-M08-03).
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function setProductStockFlag(_productId, _inStock) {
  throw new NotImplementedError('M02-F06');
}

/**
 * M02-F12 — Dữ liệu delta cho M03/M09.
 * TODO: gọi service/repository tương ứng khi triển khai.
 */
export async function getCatalogDelta(_sinceTimestamp) {
  throw new NotImplementedError('M02-F12');
}
