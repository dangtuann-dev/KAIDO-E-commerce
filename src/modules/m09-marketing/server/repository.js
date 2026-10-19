import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M09 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'banners',
  'article_categories',
  'articles',
  'campaigns',
  'campaign_items',
  'coupons',
  'coupon_usages',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M09-F01) — bảng `banners`.
 */
export async function listBanners(_filters) {
  throw new NotImplementedError('M09-F01');
}

/**
 * TODO(M09-F01) — bảng `banners`.
 */
export async function createBanner(_data) {
  throw new NotImplementedError('M09-F01');
}

/**
 * TODO(M09-F01) — bảng `banners`.
 */
export async function updateBanner(_id, _patch) {
  throw new NotImplementedError('M09-F01');
}

/**
 * TODO(M09-F02) — bảng `articles`.
 */
export async function listArticles(_filters) {
  throw new NotImplementedError('M09-F02');
}

/**
 * TODO(M09-F02) — bảng `articles`.
 */
export async function createArticle(_data) {
  throw new NotImplementedError('M09-F02');
}

/**
 * TODO(M09-F02) — bảng `articles`.
 */
export async function updateArticle(_id, _patch) {
  throw new NotImplementedError('M09-F02');
}

/**
 * TODO(M09-F03) — bảng `campaigns`.
 */
export async function listCampaigns(_filters) {
  throw new NotImplementedError('M09-F03');
}

/**
 * TODO(M09-F03) — bảng `campaigns`.
 */
export async function createCampaign(_data) {
  throw new NotImplementedError('M09-F03');
}

/**
 * TODO(M09-F05) — bảng `campaigns`.
 */
export async function updateCampaignStatus(_id, _status) {
  throw new NotImplementedError('M09-F05');
}

/**
 * TODO(M09-F03) — bảng `campaign_items`.
 */
export async function listCampaignItems(_campaignId) {
  throw new NotImplementedError('M09-F03');
}

/**
 * TODO(M09-F08) — bảng `coupons`.
 */
export async function findCouponByCode(_code) {
  throw new NotImplementedError('M09-F08');
}

/**
 * TODO(M09-F04) — bảng `coupons`.
 */
export async function createCoupon(_data) {
  throw new NotImplementedError('M09-F04');
}

/**
 * TODO(M09-F08) — bảng `coupon_usages`.
 */
export async function incrementCouponUsage(_data) {
  throw new NotImplementedError('M09-F08');
}

/**
 * TODO(M09-F08) — bảng `coupon_usages`.
 */
export async function deleteCouponUsage(_couponId, _orderId) {
  throw new NotImplementedError('M09-F08');
}
