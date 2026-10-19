import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M02-F01) — Trả cây danh mục đang hoạt động cho header/mega menu.
 */
export async function getCategoryTree() {
  throw new NotImplementedError('M02-F01');
}

/**
 * TODO(M02-F02) — Tạo danh mục đa cấp, sinh slug duy nhất.
 */
export async function createCategory() {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F02) — Cập nhật danh mục và thứ tự hiển thị.
 */
export async function updateCategory() {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F02) — Chặn xóa danh mục còn sản phẩm hoặc chuyển sản phẩm sang danh mục khác.
 */
export async function deleteCategory() {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F03) — Tạo thương hiệu đồ chơi.
 */
export async function createBrand() {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F03) — Cập nhật thương hiệu.
 */
export async function updateBrand() {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F03) — Xóa mềm thương hiệu không còn sản phẩm.
 */
export async function deleteBrand() {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F04) — Tạo sản phẩm + biến thể + ảnh trong transaction; SKU duy nhất (BR-M02-01).
 */
export async function createProduct() {
  throw new NotImplementedError('M02-F04');
}

/**
 * TODO(M02-F05) — Cập nhật thông tin sản phẩm (BR-M02-02).
 */
export async function updateProduct() {
  throw new NotImplementedError('M02-F05');
}

/**
 * TODO(M02-F06) — Gán deleted_at, giữ lịch sử đơn hàng (BR-M02-03).
 */
export async function softDeleteProduct() {
  throw new NotImplementedError('M02-F06');
}

/**
 * TODO(M02-F06) — Ẩn/ngừng kinh doanh và cập nhật chỉ mục tìm kiếm.
 */
export async function changeProductStatus() {
  throw new NotImplementedError('M02-F06');
}

/**
 * TODO(M02-F07) — Đăng ký ảnh đã upload Storage, tối đa 10 ảnh (BR-M02-04).
 */
export async function attachProductImage() {
  throw new NotImplementedError('M02-F07');
}

/**
 * TODO(M02-F07) — Gỡ ảnh và xóa object Storage tương ứng.
 */
export async function removeProductImage() {
  throw new NotImplementedError('M02-F07');
}

/**
 * TODO(M02-F08) — Cập nhật giá thường/giá sale, kiểm tra giá sale < giá thường.
 */
export async function updateProductPricing() {
  throw new NotImplementedError('M02-F08');
}

/**
 * TODO(M02-F09) — Đọc tồn khả dụng từ M08, không ghi bảng inventory.
 */
export async function readStockSummary() {
  throw new NotImplementedError('M02-F09');
}

/**
 * TODO(M02-F10) — Danh sách sản phẩm ACTIVE, phân trang 12/trang.
 */
export async function listProducts() {
  throw new NotImplementedError('M02-F10');
}

/**
 * TODO(M02-F11) — PDP theo slug/id kèm biến thể, ảnh, thương hiệu, sản phẩm liên quan.
 */
export async function getProductDetail() {
  throw new NotImplementedError('M02-F11');
}

/**
 * TODO(M02-F12) — Delta catalog theo mốc thời gian cho chỉ mục nội bộ.
 */
export async function getCatalogDelta() {
  throw new NotImplementedError('M02-F12');
}

/**
 * TODO(M02-F13) — Hợp tác M08 để trả sản phẩm chạm ngưỡng tồn thấp.
 */
export async function listLowStockProducts() {
  throw new NotImplementedError('M02-F13');
}
