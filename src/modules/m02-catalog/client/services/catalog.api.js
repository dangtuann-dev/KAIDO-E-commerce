/**
 * [TOY-M02] Client services — Sản phẩm và danh mục
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 * Trạng thái: khung (Giai đoạn 7) — backend trả 501 cho tới khi module được triển khai.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/**
 * API-M02-01 — Cây danh mục
 * Cây danh mục đa cấp đang hoạt động cho header/mega menu (M02-F01).
 * GET /api/v1/categories/tree · quyền: công khai
 * Input: Không
 * Output: [{ id, name, slug, icon, children: [...] }]
 * TODO(API-M02-01): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getCategoryTree({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-01');
  return api.get(endpoint.path, { query });
}

/**
 * API-M02-02 — Danh sách sản phẩm
 * PLP có phân trang mặc định 12 sản phẩm/trang (M02-F10).
 * GET /api/v1/products · quyền: công khai
 * Input: ?category_slug=lego&page=1&limit=24
 * Output: { total, page, limit, items: [ProductSummary] }
 * TODO(API-M02-02): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function listProducts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-02');
  return api.get(endpoint.path, { query });
}

/**
 * API-M02-03 — Chi tiết sản phẩm
 * PDP theo slug (hoặc id); kèm biến thể, ảnh, thương hiệu và sản phẩm liên quan (M02-F11).
 * GET /api/v1/products/[idOrSlug] · quyền: công khai
 * Input: slug | id
 * Output: { product_details, images, variants, brand, specs, related_products }
 * TODO(API-M02-03): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function getProductDetail({ idOrSlug, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-03');
  return api.get(resolveEndpointPath(endpoint.path, { idOrSlug }), { query });
}

/**
 * API-M02-04 — Tạo sản phẩm (Admin)
 * Tạo sản phẩm mới, SKU duy nhất toàn hệ thống (BR-M02-01).
 * POST /api/v1/admin/products · quyền: vai trò ADMIN, STAFF
 * Input: { name, sku, price_regular, price_sale, category_id, brand_id, age_group, images, variants }
 * Output: { product_id, sku, status }
 * TODO(API-M02-04): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function createProduct({ body } = {}) {
  const endpoint = getApiEndpoint('API-M02-04');
  return api.post(endpoint.path, body);
}

/**
 * API-M02-05 — Cập nhật sản phẩm (Admin)
 * Cập nhật thông tin, giá, trạng thái sản phẩm (M02-F05, F06, F08).
 * PUT /api/v1/admin/products/[id] · quyền: vai trò ADMIN, STAFF
 * Input: { name, price_regular, price_sale, status, ... }
 * Output: { product_id, updated_at }
 * TODO(API-M02-05): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function updateProduct({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M02-05');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/**
 * API-M02-06 — Xóa mềm sản phẩm (Admin)
 * Xóa mềm: gán deleted_at, giữ dữ liệu lịch sử (M02-F06).
 * DELETE /api/v1/admin/products/[id] · quyền: vai trò ADMIN, STAFF
 * Input: id
 * Output: { success: true, message: 'Da xoa mem san pham' }
 * TODO(API-M02-06): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function deleteProduct({ id } = {}) {
  const endpoint = getApiEndpoint('API-M02-06');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}

/**
 * API-M02-07 — Đồng bộ catalog nội bộ
 * Dữ liệu delta cho search index (M02-F12). Chỉ dùng nội bộ, không dành cho trình duyệt.
 * GET /api/v1/internal/products/catalog-sync · quyền: vai trò ADMIN
 * Input: ?since_timestamp=1700000000
 * Output: [{ sku, name, price, stock, status, updated_at }]
 * TODO(API-M02-07): giữ nguyên chữ ký khi backend hoàn thiện.
 */
export function syncCatalog({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-07');
  return api.get(endpoint.path, { query });
}
