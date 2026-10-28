/**
 * [TOY-M08] Client services — Kho và tồn kho
 * Mỗi hàm ứng với một API-Mxx-yy trong registry; path đọc từ src/shared/api-endpoints.js.
 */
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

/** API-M08-01 — Kiểm tra tồn kho (công khai). */
export function checkStock({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-01');
  return api.get(endpoint.path, { query });
}

/** API-M08-02 — Giữ tồn kho. */
export function reserveStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-02');
  return api.post(endpoint.path, body);
}

/** API-M08-03 — Giải phóng tồn kho. */
export function releaseStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-03');
  return api.post(endpoint.path, body);
}

/** API-M08-04 — Xuất kho thực tế. */
export function fulfillStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-04');
  return api.post(endpoint.path, body);
}

/** API-M08-05 — Tạo phiếu nhập kho. */
export function createGoodsReceipt({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-05');
  return api.post(endpoint.path, body);
}

/** API-M08-06 — Tạo phiếu điều chỉnh kiểm kê. */
export function createStockAdjustment({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-06');
  return api.post(endpoint.path, body);
}

/** API-M08-07 — Thẻ kho. */
export function getStockCard({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-07');
  return api.get(endpoint.path, { query });
}

/** API-M08-08 — Danh sách tồn kho (Admin). */
export function listInventoryStock({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-08');
  return api.get(endpoint.path, { query });
}

/** API-M08-09 — Danh sách kho. */
export function listWarehouses({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-09');
  return api.get(endpoint.path, { query });
}

/** API-M08-10 — Tạo kho. */
export function createWarehouse({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-10');
  return api.post(endpoint.path, body);
}

/** API-M08-11 — Cập nhật kho. */
export function updateWarehouse({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M08-11');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M08-12 — Danh sách nhà cung cấp. */
export function listSuppliers({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-12');
  return api.get(endpoint.path, { query });
}

/** API-M08-13 — Tạo nhà cung cấp. */
export function createSupplier({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-13');
  return api.post(endpoint.path, body);
}

/** API-M08-14 — Cập nhật nhà cung cấp. */
export function updateSupplier({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M08-14');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M08-15 — Danh sách phiếu nhập kho. */
export function listGoodsReceipts({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-15');
  return api.get(endpoint.path, { query });
}

/** API-M08-16 — Danh sách phiếu kiểm kê. */
export function listStockAdjustments({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-16');
  return api.get(endpoint.path, { query });
}

/** API-M08-17 — Duyệt/hủy phiếu kiểm kê. */
export function decideStockAdjustment({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M08-17');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M08-18 — Danh sách phiếu chuyển kho. */
export function listStockTransfers({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-18');
  return api.get(endpoint.path, { query });
}

/** API-M08-19 — Tạo phiếu chuyển kho. */
export function createStockTransfer({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-19');
  return api.post(endpoint.path, body);
}

/** API-M08-20 — Xuất/nhận/hủy phiếu chuyển kho. */
export function updateStockTransfer({ id, body } = {}) {
  const endpoint = getApiEndpoint('API-M08-20');
  return api.put(resolveEndpointPath(endpoint.path, { id }), body);
}

/** API-M08-21 — Nhập lại hàng hoàn. */
export function receiveReturnedStock({ body } = {}) {
  const endpoint = getApiEndpoint('API-M08-21');
  return api.post(endpoint.path, body);
}

/** API-M08-22 — Danh sách tồn kho thấp. */
export function listLowStock({ query = {} } = {}) {
  const endpoint = getApiEndpoint('API-M08-22');
  return api.get(endpoint.path, { query });
}

/** API-M08-23 — Tổng hợp tồn kho. */
export function getInventorySummary() {
  const endpoint = getApiEndpoint('API-M08-23');
  return api.get(endpoint.path);
}
