import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M07 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'membership_tiers',
  'loyalty_accounts',
  'loyalty_point_transactions',
  'customer_vouchers',
  'coupons',
  'coupon_usages',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M07-F03) — bảng `loyalty_accounts`.
 */
export async function findLoyaltyAccount(_userId) {
  throw new NotImplementedError('M07-F03');
}

/**
 * TODO(M07-F03) — bảng `loyalty_accounts`.
 */
export async function upsertLoyaltyAccount(_userId, _data) {
  throw new NotImplementedError('M07-F03');
}

/**
 * TODO(M07-F05) — bảng `loyalty_accounts`.
 */
export async function updateLoyaltyAccount(_userId, _patch) {
  throw new NotImplementedError('M07-F05');
}

/**
 * TODO(M07-F07) — bảng `loyalty_point_transactions`.
 */
export async function appendPointTransaction(_data) {
  throw new NotImplementedError('M07-F07');
}

/**
 * TODO(M07-F07) — bảng `loyalty_point_transactions`.
 */
export async function listPointTransactions(_userId, _filters) {
  throw new NotImplementedError('M07-F07');
}

/**
 * TODO(M07-F03) — bảng `loyalty_point_transactions`.
 */
export async function sumExpiringPoints(_userId, _beforeDate) {
  throw new NotImplementedError('M07-F03');
}

/**
 * TODO(M07-F06) — bảng `customer_vouchers`.
 */
export async function listCustomerVouchers(_userId, _status) {
  throw new NotImplementedError('M07-F06');
}

/**
 * TODO(M07-F06) — bảng `customer_vouchers`.
 */
export async function assignCustomerVoucher(_data) {
  throw new NotImplementedError('M07-F06');
}

/**
 * TODO(M07-F06) — bảng `customer_vouchers`.
 */
export async function markCustomerVoucherUsed(_id) {
  throw new NotImplementedError('M07-F06');
}

/**
 * TODO(M07-F05) — bảng `loyalty_accounts`.
 */
export async function listTierSummary() {
  throw new NotImplementedError('M07-F05');
}
