import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import * as repo from './server/repository.js';
import { getCatalogDelta as getCatalogDeltaService, getSearchCatalog as getSearchCatalogService } from './server/service.js';

/**
 * [SERVER] Hợp đồng công khai của M02 cho module khác.
 * Module ngoài chỉ được import file này; không import sâu vào server/.
 */

function notFound(message) {
  return new AppError(ERROR_CODES.NOT_FOUND, message);
}

function priceOf(product) {
  const regular = Number(product.price_regular);
  const sale = product.price_sale == null ? null : Number(product.price_sale);
  return { regular, sale, price: sale != null && sale < regular ? sale : regular };
}

/**
 * M02-F11 — Snapshot tên/SKU/giá/ảnh tại thời điểm đặt hàng (BR-M05-05).
 * @param {string} productId
 * @param {string} [variantId]
 */
export async function getProductSnapshot(productId, variantId) {
  const product = await repo.findProductById(productId, { includeDeleted: true });
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  const variants = await repo.listVariantsByProduct(productId, { includeDeleted: true });
  const variant = variantId
    ? variants.find((item) => item.id === variantId)
    : variants.find((item) => item.is_default && !item.deleted_at) ??
      variants.find((item) => !item.deleted_at);

  if (!variant) throw notFound('Không tìm thấy biến thể sản phẩm.');

  const images = await repo.listImagesByProduct(productId);
  const thumbnail = images.find((image) => image.is_thumbnail) ?? images[0] ?? null;
  const prices = priceOf(product);

  return {
    product_id: product.id,
    variant_id: variant.id,
    sku: variant.sku,
    name:
      variant.name && variant.name !== 'Mặc định'
        ? `${product.name} - ${variant.name}`
        : product.name,
    product_name: product.name,
    slug: product.slug,
    price: prices.price,
    price_regular: prices.regular,
    price_sale: prices.sale,
    image_url: variant.image_url ?? thumbnail?.url ?? null,
    status: product.status,
    deleted_at: product.deleted_at ?? null,
  };
}

/**
 * M02-F10 — Thông tin tối thiểu cho giỏ hàng/tìm kiếm.
 * @param {string[]} productIds
 */
export async function listProductSnapshots(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];

  const rows = await repo.listProductSummariesByIds(productIds);
  return rows.map((product) => {
    const images = product.product_images ?? [];
    const thumbnail = images.find((image) => image.is_thumbnail) ?? images[0] ?? null;
    const prices = priceOf(product);
    return {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      thumbnail_url: thumbnail?.url ?? null,
      price: prices.price,
      price_regular: prices.regular,
      price_sale: prices.sale,
      status: product.status,
    };
  });
}

/**
 * M02-F11 — Đồng bộ rating_avg/rating_count từ M10 (BR-M10-03).
 * @param {string} productId
 * @param {{ rating_avg: number, rating_count: number }} summary
 */
export async function updateProductRatingSummary(productId, summary) {
  const ratingAvg = Number(summary?.rating_avg);
  const ratingCount = Number(summary?.rating_count);

  if (
    !Number.isFinite(ratingAvg) ||
    ratingAvg < 0 ||
    ratingAvg > 5 ||
    !Number.isInteger(ratingCount) ||
    ratingCount < 0
  ) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Tổng hợp đánh giá không hợp lệ (rating_avg 0–5, rating_count nguyên không âm).',
    );
  }

  const updated = await repo.updateProductRatingSummaryRow(productId, {
    rating_avg: Math.round(ratingAvg * 10) / 10,
    rating_count: ratingCount,
  });
  if (!updated) throw notFound('Không tìm thấy sản phẩm.');

  return {
    product_id: updated.id,
    rating_avg: Number(updated.rating_avg),
    rating_count: Number(updated.rating_count),
  };
}

/**
 * M02-F06 — M08 báo hết hàng.
 * Tồn kho được M02 đọc trực tiếp từ M08 khi hiển thị nên không lưu cờ denormalized;
 * hàm giữ hợp đồng cho M08 và xác nhận sản phẩm còn tồn tại.
 * @param {string} productId
 * @param {boolean} inStock
 */
export async function setProductStockFlag(productId, inStock) {
  const product = await repo.findProductById(productId, { includeDeleted: true });
  if (!product) throw notFound('Không tìm thấy sản phẩm.');

  return { product_id: product.id, in_stock: Boolean(inStock) };
}

/**
 * M02-F10 — Dữ liệu catalog chỉ đọc cho M03 (BR-M03-05, BR-M03-07).
 * Trả sản phẩm ACTIVE kèm mô tả, danh mục, SKU và trạng thái tồn kho.
 */
export async function getSearchCatalog() {
  return getSearchCatalogService();
}

/**
 * M02-F12 — Dữ liệu delta cho M03/M09.
 * @param {number} sinceTimestamp Unix giây
 */
export async function getCatalogDelta(sinceTimestamp) {
  return getCatalogDeltaService({ since_timestamp: sinceTimestamp });
}
