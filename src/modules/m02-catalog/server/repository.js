import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M02 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'categories',
  'brands',
  'products',
  'product_categories',
  'product_variants',
  'product_images',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M02-F01) — bảng `categories`.
 */
export async function listCategoryTree() {
  throw new NotImplementedError('M02-F01');
}

/**
 * TODO(M02-F01) — bảng `categories`.
 */
export async function findCategoryBySlug(_slug) {
  throw new NotImplementedError('M02-F01');
}

/**
 * TODO(M02-F02) — bảng `categories`.
 */
export async function createCategory(_data) {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F02) — bảng `categories`.
 */
export async function updateCategory(_id, _patch) {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F02) — bảng `categories`.
 */
export async function softDeleteCategory(_id) {
  throw new NotImplementedError('M02-F02');
}

/**
 * TODO(M02-F03) — bảng `brands`.
 */
export async function listBrands() {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F03) — bảng `brands`.
 */
export async function createBrand(_data) {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F03) — bảng `brands`.
 */
export async function updateBrand(_id, _patch) {
  throw new NotImplementedError('M02-F03');
}

/**
 * TODO(M02-F11) — bảng `products`.
 */
export async function findProductByIdOrSlug(_idOrSlug) {
  throw new NotImplementedError('M02-F11');
}

/**
 * TODO(M02-F10) — bảng `products`.
 */
export async function listProducts(_filters) {
  throw new NotImplementedError('M02-F10');
}

/**
 * TODO(M02-F04) — bảng `products`.
 */
export async function createProduct(_data) {
  throw new NotImplementedError('M02-F04');
}

/**
 * TODO(M02-F05) — bảng `products`.
 */
export async function updateProduct(_id, _patch) {
  throw new NotImplementedError('M02-F05');
}

/**
 * TODO(M02-F06) — bảng `products`.
 */
export async function softDeleteProduct(_id) {
  throw new NotImplementedError('M02-F06');
}

/**
 * TODO(M02-F11) — bảng `product_variants`.
 */
export async function listVariantsByProduct(_productId) {
  throw new NotImplementedError('M02-F11');
}

/**
 * TODO(M02-F07) — bảng `product_images`.
 */
export async function listImagesByProduct(_productId) {
  throw new NotImplementedError('M02-F07');
}

/**
 * TODO(M02-F07) — bảng `product_images`.
 */
export async function createProductImage(_data) {
  throw new NotImplementedError('M02-F07');
}

/**
 * TODO(M02-F07) — bảng `product_images`.
 */
export async function deleteProductImage(_id) {
  throw new NotImplementedError('M02-F07');
}
