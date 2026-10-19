import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M08-F01) — Tạo kho/điểm chứa, đặt kho mặc định.
 */
export async function createWarehouse() {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F01) — Sửa/vô hiệu hóa kho.
 */
export async function updateWarehouse() {
  throw new NotImplementedError('M08-F01');
}

/**
 * TODO(M08-F02) — Phiếu nhập NCC + tăng on_hand + ghi thẻ kho trong transaction.
 */
export async function createGoodsReceipt() {
  throw new NotImplementedError('M08-F02');
}

/**
 * TODO(M08-F03) — Tra tồn theo SKU/biến thể/kho, lọc sắp hết.
 */
export async function getInventoryStock() {
  throw new NotImplementedError('M08-F03');
}

/**
 * TODO(M08-F04) — Trả available theo SKU cho giỏ/PDP (< 100ms nhờ cache).
 */
export async function checkStockAvailability() {
  throw new NotImplementedError('M08-F04');
}

/**
 * TODO(M08-F05) — Gọi RPC reserve_stock cho order_ref, TTL 20 phút (BR-M08-02).
 */
export async function reserveStock() {
  throw new NotImplementedError('M08-F05');
}

/**
 * TODO(M08-F06) — Gọi RPC fulfill_stock: giảm on_hand và reserved, ghi export note.
 */
export async function fulfillStock() {
  throw new NotImplementedError('M08-F06');
}

/**
 * TODO(M08-F07) — Gọi RPC release_stock khi hủy/timeout; hỗ trợ API mở khóa thủ công.
 */
export async function releaseStock() {
  throw new NotImplementedError('M08-F07');
}

/**
 * TODO(M08-F08) — Phân loại hàng nguyên vẹn/lỗi khi nhập lại hàng hoàn.
 */
export async function receiveReturnedStock() {
  throw new NotImplementedError('M08-F08');
}

/**
 * TODO(M08-F09) — Tạo phiếu kiểm kê; tự duyệt hoặc PENDING_APPROVAL theo ngưỡng.
 */
export async function createStockAdjustment() {
  throw new NotImplementedError('M08-F09');
}

/**
 * TODO(M08-F09) — ADMIN duyệt phiếu lệch lớn.
 */
export async function approveStockAdjustment() {
  throw new NotImplementedError('M08-F09');
}

/**
 * TODO(M08-F10) — Phiếu luân chuyển 2 bước A -> in-transit -> B.
 */
export async function createStockTransfer() {
  throw new NotImplementedError('M08-F10');
}

/**
 * TODO(M08-F11) — Cron quét safety stock, gửi cảnh báo và đồng bộ cờ M02.
 */
export async function scanLowStock() {
  throw new NotImplementedError('M08-F11');
}

/**
 * TODO(M08-F12) — CRUD nhà cung cấp.
 */
export async function manageSupplier() {
  throw new NotImplementedError('M08-F12');
}

/**
 * TODO(M08-F13) — Tồn đầu/cuối kỳ + biến động bất biến.
 */
export async function getStockCard() {
  throw new NotImplementedError('M08-F13');
}
