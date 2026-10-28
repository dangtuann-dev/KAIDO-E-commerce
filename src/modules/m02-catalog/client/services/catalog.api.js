/**
 * [TOY-M02] Client services — Sản phẩm và danh mục
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/** API-M02-01 — GET /api/v1/categories/tree · công khai */
export function getCategoryTree({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-01');
  return api.get(endpoint.path, { query });
}

/** API-M02-02 — GET /api/v1/products · công khai */
export function listProducts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-02');
  return api.get(endpoint.path, { query });
}

/** API-M02-03 — GET /api/v1/products/[idOrSlug] · công khai */
export function getProductDetail({ idOrSlug, query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-03');
  return api.get(resolveEndpointPath(endpoint.path, { idOrSlug }), { query });
}

/** API-M02-04 — POST /api/v1/admin/products · ADMIN, STAFF */
export function createProduct({ body } = {}) {
  const endpoint = getApiEndpoint('API-M02-04');
  return api.post(endpoint.path, body);
}

/** API-M02-05 — PUT /api/v1/admin/products/[id] · ADMIN, STAFF */
export function updateProduct({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M02-05');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M02-06 — DELETE /api/v1/admin/products/[id] · ADMIN, STAFF */
export function deleteProduct({ id } = {}) {
  const endpoint = getApiEndpoint('API-M02-06');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}

/** API-M02-07 — GET /api/v1/internal/products/catalog-sync · ADMIN */
export function syncCatalog({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-07');
  return api.get(endpoint.path, { query });
}

/** API-M02-08 — GET /api/v1/admin/products · ADMIN, STAFF */
export function listAdminProducts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-08');
  return api.get(endpoint.path, { query });
}

/** API-M02-09 — GET /api/v1/admin/products/[id] · ADMIN, STAFF */
export function getAdminProductDetail({ id } = {}) {
  const endpoint = getApiEndpoint('API-M02-09');
  return api.get(resolveEndpointPath(endpoint.path, { id }));
}

/** API-M02-10 — GET /api/v1/brands · công khai */
export function listBrands({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M02-10');
  return api.get(endpoint.path, { query });
}

/** API-M02-11 — GET /api/v1/admin/categories · ADMIN, STAFF */
export function listAdminCategories(_variables = {}) {
  const endpoint = getApiEndpoint('API-M02-11');
  return api.get(endpoint.path);
}

/** API-M02-12 — POST /api/v1/admin/categories · ADMIN, STAFF */
export function createCategory({ body } = {}) {
  const endpoint = getApiEndpoint('API-M02-12');
  return api.post(endpoint.path, body);
}

/** API-M02-13 — PUT /api/v1/admin/categories/[id] · ADMIN, STAFF */
export function updateCategory({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M02-13');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M02-14 — DELETE /api/v1/admin/categories/[id] · ADMIN, STAFF */
export function deleteCategory({ id } = {}) {
  const endpoint = getApiEndpoint('API-M02-14');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}

/** API-M02-15 — GET /api/v1/admin/brands · ADMIN, STAFF */
export function listAdminBrands(_variables = {}) {
  const endpoint = getApiEndpoint('API-M02-15');
  return api.get(endpoint.path);
}

/** API-M02-16 — POST /api/v1/admin/brands · ADMIN, STAFF */
export function createBrand({ body } = {}) {
  const endpoint = getApiEndpoint('API-M02-16');
  return api.post(endpoint.path, body);
}

/** API-M02-17 — PUT /api/v1/admin/brands/[id] · ADMIN, STAFF */
export function updateBrand({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M02-17');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M02-18 — DELETE /api/v1/admin/brands/[id] · ADMIN, STAFF */
export function deleteBrand({ id } = {}) {
  const endpoint = getApiEndpoint('API-M02-18');
  return api.delete(resolveEndpointPath(endpoint.path, { id }));
}
