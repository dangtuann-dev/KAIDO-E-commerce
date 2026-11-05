import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { buildPaginationMeta, parsePagination } from '@/server/http/pagination.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { ORDER_STATUS } from '@/shared/constants/order-status.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import { CouponService } from '@/modules/m09-marketing/public.server.js';
import { getOrderByRef } from '@/modules/m05-checkout/public.server.js';
import { listCustomersWithBirthday } from '@/modules/m01-account/public.server.js';
import {
  MAX_REDEMPTION_PERCENT,
  POINT_EXPIRY_DAYS,
  POINT_VALUE_VND,
  REDEEM_POINT_MULTIPLE,
  TIER_LABELS,
  TIER_RULES,
  VND_PER_EARNED_POINT,
} from './constants.js';
import * as repo from './repository.js';

/**
 * [SERVER] M07 — khuyến mãi và khách hàng thân thiết.
 * SRS: TOY-M07 (M07-F01..F07). Repository chỉ ánh xạ dữ liệu; mọi quy tắc nằm ở đây.
 * Voucher đi qua CouponService duy nhất của M09 (OPEN_DECISIONS #9).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_DAYS = 30;

const TRANSACTION_LABELS = Object.freeze({
  EARN: 'Tích điểm',
  REDEEM: 'Sử dụng điểm',
  REFUND: 'Hoàn điểm',
  EXPIRE: 'Điểm hết hạn',
  ADJUST: 'Điều chỉnh điểm',
});

function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

function notFound(message = 'Không tìm thấy dữ liệu.') {
  return fail(404, ERROR_CODES.NOT_FOUND, message);
}

function invalid(message, details) {
  return fail(422, ERROR_CODES.VALIDATION_ERROR, message, details);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

/** BR-M07-01 — số điểm nhận được, làm tròn xuống, có hệ số hạng. */
export function earnedPointsFor(baseAmount, multiplier = 1) {
  const base = Math.max(0, Math.round(toNumber(baseAmount)));
  const factor = Math.max(1, toNumber(multiplier) || 1);
  return Math.floor((base * factor) / VND_PER_EARNED_POINT);
}

/** BR-M07-02/03 — trần 50% hóa đơn và bội số 10 điểm. */
export function maxRedeemablePoints(availablePoints, subtotal) {
  const capByPercent = Math.floor(
    (Math.max(0, toNumber(subtotal)) * MAX_REDEMPTION_PERCENT) / 100 / POINT_VALUE_VND,
  );
  const capByMultiple = Math.floor(capByPercent / REDEEM_POINT_MULTIPLE) * REDEEM_POINT_MULTIPLE;
  const availableByMultiple =
    Math.floor(Math.max(0, toNumber(availablePoints)) / REDEEM_POINT_MULTIPLE) *
    REDEEM_POINT_MULTIPLE;
  return Math.max(0, Math.min(availableByMultiple, capByMultiple));
}

async function resolveTier(tierCode) {
  const tiers = await repo.listMembershipTiers();
  const tier = tiers.find((row) => row.code === tierCode) ?? tiers[0] ?? null;
  return {
    tier,
    code: tier?.code ?? tierCode ?? 'BRONZE',
    label: tier?.name ?? TIER_LABELS[tierCode] ?? TIER_LABELS.BRONZE,
    multiplier: toNumber(tier?.point_multiplier ?? TIER_RULES[tierCode]?.pointMultiplier ?? 1),
  };
}

function voucherView(row, now = Date.now()) {
  const coupon = row.coupon ?? null;
  const expired =
    Boolean(row.expires_at) && Date.parse(row.expires_at) < now;
  const couponExpired = coupon?.valid_to ? Date.parse(coupon.valid_to) < now : false;
  const used = row.status === 'USED' || Boolean(row.used_at);
  const inactive = coupon ? coupon.is_active === false || Boolean(coupon.deleted_at) : true;

  let reason = null;
  if (used) reason = 'Đã sử dụng';
  else if (expired || couponExpired) reason = 'Đã hết hạn';
  else if (inactive) reason = 'Chương trình đã kết thúc';

  return {
    voucher_id: row.id,
    status: row.status,
    source: row.source,
    assigned_at: row.assigned_at,
    used_at: row.used_at,
    expires_at: row.expires_at,
    usable: reason === null,
    reason,
    coupon,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F02 — Áp dụng mã khuyến mãi                                    */
/* ------------------------------------------------------------------ */

/**
 * API-M07-01 — kiểm tra voucher qua CouponService M09.
 * Lỗi nghiệp vụ trả `is_valid:false` thay vì 4xx để form hiển thị ngay.
 */
export async function validateVoucher(input = {}) {
  const code = String(input.code ?? '').trim().toUpperCase();
  try {
    const result = await CouponService.verifyCoupon({
      code,
      order_amount: toNumber(input.order_subtotal),
      user_id: input.customer_id ?? null,
      items: input.items ?? [],
    });

    return {
      is_valid: true,
      discount_amount: toNumber(result.discount_amount),
      freeship: Boolean(result.freeship),
      message: result.message,
      coupon: result.coupon,
    };
  } catch (error) {
    const businessCodes = [
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.NOT_FOUND,
      ERROR_CODES.CONFLICT,
      ERROR_CODES.INVALID_VOUCHER,
    ];
    if (error instanceof AppError && businessCodes.includes(error.code)) {
      return { is_valid: false, discount_amount: 0, message: error.message };
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* M07-F03/F06 — Điểm thưởng và đặc quyền hạng                        */
/* ------------------------------------------------------------------ */

/** API-M07-02 — điểm khả dụng, hạng, điểm sắp hết hạn và ví voucher. */
export async function getMyPoints({ userId }) {
  const account = await repo.ensureLoyaltyAccount(userId);
  if (!account) throw notFound('Không tìm thấy tài khoản khách hàng.');

  const [tier, expiringRaw, vouchers] = await Promise.all([
    resolveTier(account.tier_code),
    repo.sumExpiringPoints(userId, addDays(new Date(), EXPIRING_WINDOW_DAYS)),
    repo.listCustomerVouchers(userId),
  ]);

  const available = toNumber(account.available_points);
  const rollingSpend = toNumber(account.rolling_spend_12m);
  const tiers = await repo.listMembershipTiers();
  const nextTier = tiers.find((row) => toNumber(row.min_spend) > rollingSpend) ?? null;

  return {
    user_id: userId,
    total_points: available,
    available_points: available,
    lifetime_points: toNumber(account.total_points),
    current_tier: tier.code,
    tier_label: tier.label,
    point_multiplier: tier.multiplier,
    rolling_spend_12m: rollingSpend,
    lifetime_spend: toNumber(account.lifetime_spend),
    tier_updated_at: account.tier_updated_at,
    next_tier: nextTier?.code ?? null,
    next_tier_label: nextTier?.name ?? null,
    next_tier_min_spend: nextTier ? toNumber(nextTier.min_spend) : null,
    points_to_next_tier: nextTier
      ? Math.max(0, toNumber(nextTier.min_spend) - rollingSpend)
      : 0,
    points_expiring: Math.min(available, expiringRaw),
    expiry_window_days: EXPIRING_WINDOW_DAYS,
    value_vnd: available * POINT_VALUE_VND,
    benefits: tier.tier?.benefits ?? {},
    vouchers: vouchers.map((row) => voucherView(row)),
  };
}

/** M07-F06 — hệ số tích điểm và quyền lợi hiện tại của hạng. */
export async function applyTierBenefits(userId) {
  const account = await repo.ensureLoyaltyAccount(userId);
  const tier = await resolveTier(account?.tier_code);
  return {
    tier_code: tier.code,
    tier_label: tier.label,
    point_multiplier: tier.multiplier,
    benefits: tier.tier?.benefits ?? {},
  };
}

/* ------------------------------------------------------------------ */
/* M07-F04 — Tiêu điểm                                                */
/* ------------------------------------------------------------------ */

/**
 * Hợp đồng M05 — kiểm tra bội số 10 và trần 50% hóa đơn.
 * Số điểm vượt trần được cắt bớt (không chặn đơn) và trả lại `max_redeemable_points`.
 */
export async function calculatePointsDiscount(userId, points, subtotal) {
  const requested = Math.max(0, Math.floor(toNumber(points)));
  const amount = Math.max(0, Math.round(toNumber(subtotal)));
  const account = await repo.ensureLoyaltyAccount(userId);
  const available = toNumber(account?.available_points);
  const maxPoints = maxRedeemablePoints(available, amount);

  if (requested === 0) {
    return {
      points_used: 0,
      discount_amount: 0,
      available_points: available,
      max_redeemable_points: maxPoints,
    };
  }

  if (requested % REDEEM_POINT_MULTIPLE !== 0) {
    throw invalid(`Điểm tiêu phải là bội số của ${REDEEM_POINT_MULTIPLE}.`);
  }
  if (requested > available) {
    throw invalid(`Bạn chỉ có ${available.toLocaleString('vi-VN')} điểm khả dụng.`, {
      available_points: available,
    });
  }

  const pointsUsed = Math.min(requested, maxPoints);
  return {
    points_used: pointsUsed,
    discount_amount: pointsUsed * POINT_VALUE_VND,
    available_points: available,
    max_redeemable_points: maxPoints,
  };
}

/** API-M07-04 — kết hợp voucher (M09) và điểm, trả tổng giảm giá. */
export async function calculateLoyaltyDiscount({ userId, body = {} }) {
  const subtotal = Math.max(0, Math.round(toNumber(body.subtotal)));

  let voucher = null;
  let voucherDiscount = 0;
  if (body.voucher_code) {
    voucher = await validateVoucher({
      code: body.voucher_code,
      order_subtotal: subtotal,
      customer_id: userId,
    });
    if (voucher.is_valid && !voucher.freeship) voucherDiscount = voucher.discount_amount;
  }

  const remaining = Math.max(0, subtotal - voucherDiscount);
  const points = await calculatePointsDiscount(userId, body.points_redeemed, remaining);
  const totalDiscount = Math.min(subtotal, voucherDiscount + points.discount_amount);

  return {
    subtotal,
    voucher_code: body.voucher_code ?? null,
    voucher,
    voucher_discount: voucherDiscount,
    points_discount: points.discount_amount,
    points_used: points.points_used,
    points_available: points.available_points,
    max_redeemable_points: points.max_redeemable_points,
    total_discount: totalDiscount,
    final_subtotal: subtotal - totalDiscount,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F03 — Cộng điểm khi đơn hoàn tất                               */
/* ------------------------------------------------------------------ */

/**
 * Hợp đồng M05/M06 — cộng điểm cho đơn COMPLETED (idempotent theo đơn).
 * @param {string} orderId id hoặc order_code
 */
export async function awardOrderPoints(orderId) {
  const found = await getOrderByRef(orderId);
  if (!found?.order) throw notFound('Không tìm thấy đơn hàng để tích điểm.');

  const order = found.order;
  if (order.status !== ORDER_STATUS.COMPLETED) {
    return { awarded: false, reason: 'ORDER_NOT_COMPLETED', order_id: order.id };
  }
  if (!order.user_id) {
    return { awarded: false, reason: 'GUEST_ORDER', order_id: order.id };
  }

  const baseAmount = Math.max(0, Math.round(toNumber(order.total_amount)));
  if (baseAmount < VND_PER_EARNED_POINT) {
    return { awarded: false, reason: 'BELOW_MIN_SPEND', order_id: order.id };
  }

  const account = await repo.ensureLoyaltyAccount(order.user_id);
  const tier = await resolveTier(account?.tier_code);
  const points = earnedPointsFor(baseAmount, tier.multiplier);
  if (points <= 0) {
    return { awarded: false, reason: 'BELOW_MIN_SPEND', order_id: order.id };
  }

  const expiresAt = addDays(new Date(), POINT_EXPIRY_DAYS).toISOString();
  const result = await repo.awardPoints({
    userId: order.user_id,
    orderId: order.id,
    points,
    expiresAt,
    description: `Tích điểm đơn ${order.order_code}`,
  });

  if (result.error) {
    return { awarded: false, reason: result.error, order_id: order.id };
  }

  const tierResult = await repo.evaluateTier(order.user_id);

  return {
    awarded: Boolean(result.awarded),
    already_awarded: Boolean(result.already_awarded),
    order_id: order.id,
    order_code: order.order_code,
    user_id: order.user_id,
    base_amount: baseAmount,
    point_multiplier: tier.multiplier,
    points_awarded: toNumber(result.points),
    balance_after: toNumber(result.balance_after),
    expires_at: expiresAt,
    tier: tierResult.tier_code ?? account?.tier_code,
  };
}

/** Hợp đồng M05 — trừ điểm ngay khi đơn được tạo. */
export async function redeemOrderPoints(orderId) {
  const found = await getOrderByRef(orderId);
  if (!found?.order) throw notFound('Không tìm thấy đơn hàng để trừ điểm.');

  const order = found.order;
  const points = Math.floor(toNumber(order.points_used));
  if (!order.user_id || points <= 0) {
    return { redeemed: false, reason: 'NO_POINTS', order_id: order.id };
  }

  const result = await repo.redeemPoints({
    userId: order.user_id,
    orderId: order.id,
    points,
    description: `Sử dụng điểm cho đơn ${order.order_code}`,
  });

  if (result.error) {
    return { redeemed: false, reason: result.error, order_id: order.id };
  }

  return {
    ...result,
    order_id: order.id,
    order_code: order.order_code,
    user_id: order.user_id,
  };
}

/** Hợp đồng M05 — hoàn 100% điểm khi đơn hủy/trả (idempotent). */
export async function refundOrderPoints(orderId) {
  const found = await getOrderByRef(orderId);
  if (!found?.order) throw notFound('Không tìm thấy đơn hàng để hoàn điểm.');

  const order = found.order;
  if (!order.user_id) {
    return { refunded: false, reason: 'GUEST_ORDER', order_id: order.id };
  }

  const result = await repo.refundPoints({
    userId: order.user_id,
    orderId: order.id,
  });

  return {
    ...result,
    order_id: order.id,
    order_code: order.order_code,
    user_id: order.user_id,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F05 — Hạng thành viên                                          */
/* ------------------------------------------------------------------ */

export async function evaluateMembershipTier(userId) {
  const result = await repo.evaluateTier(userId);
  return {
    ...result,
    tier_label: TIER_LABELS[result.tier_code] ?? result.tier_name ?? result.tier_code,
  };
}

/** API-M07-06 — số thành viên theo hạng và ngưỡng chi tiêu. */
export async function getTierSummary() {
  const tiers = await repo.listTierSummary();
  return {
    total_members: tiers.reduce((sum, row) => sum + row.member_count, 0),
    tiers,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F01 — Tạo voucher qua CouponService M09                        */
/* ------------------------------------------------------------------ */

/** API-M07-05 — tạo voucher; mặc định hiệu lực 1 năm nếu không truyền khung giờ. */
export async function createVoucher(data = {}) {
  const now = new Date();
  const startTime = data.start_time ?? now.toISOString();
  const endTime = data.end_time ?? addDays(now, 365).toISOString();

  const created = await CouponService.createCoupon({
    body: {
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      max_discount: data.max_discount,
      min_order: data.min_order ?? 0,
      usage_limit: data.usage_limit,
      usage_limit_per_user: data.usage_limit_per_user,
      start_time: startTime,
      end_time: endTime,
    },
    auth: { userId: data.created_by ?? null },
  });

  return {
    voucher_id: created.coupon_id,
    code: created.code,
    status: created.status ?? (created.coupon?.is_active === false ? 'INACTIVE' : 'ACTIVE'),
    coupon: created.coupon ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F06 — Voucher sinh nhật                                        */
/* ------------------------------------------------------------------ */

async function ensureSystemVoucher(code, value) {
  const existing = await CouponService.findCouponByCode(code);
  if (existing) return existing;

  try {
    const created = await CouponService.createCoupon({
      body: {
        code,
        name: `Voucher sinh nhật ${formatVND(value)}`,
        description: 'Voucher tặng khách hàng có sinh nhật của bé trong tháng (M07-F06).',
        type: 'FIXED',
        value,
        min_order: 0,
        usage_limit: null,
        start_time: '2020-01-01T00:00:00.000Z',
        end_time: '2035-12-31T23:59:59.000Z',
      },
      auth: { userId: null },
    });
    return created.coupon ?? { ...created, id: created.coupon_id };
  } catch (error) {
    // Hai tiến trình cron chạy đồng thời: mã đã được tạo ở lần gọi trước.
    if (error instanceof AppError && error.code === ERROR_CODES.DUPLICATE_RESOURCE) {
      return CouponService.findCouponByCode(code);
    }
    throw error;
  }
}

/**
 * Tặng voucher sinh nhật hằng tháng: 100.000đ, riêng hạng DIAMOND 200.000đ.
 * Idempotent theo (khách, voucher, năm) nhờ m07_assign_voucher / kiểm tra năm.
 */
export async function issueBirthdayVouchers(now = new Date()) {
  const month = now.getMonth() + 1;
  const customers = await listCustomersWithBirthday(month);
  if (customers.length === 0) {
    return { month, issued: 0, already_assigned: 0, skipped: 0, customers: 0 };
  }

  const [basic, diamond] = await Promise.all([
    ensureSystemVoucher('BDAY100K', 100000),
    ensureSystemVoucher('BDAY200K', 200000),
  ]);

  let issued = 0;
  let alreadyAssigned = 0;
  let skipped = 0;

  for (const customer of customers) {
    const account = await repo.findLoyaltyAccount(customer.id);
    const voucher = account?.tier_code === 'DIAMOND' ? diamond : basic;
    const couponId = voucher?.id ?? voucher?.coupon_id ?? null;

    if (!couponId) {
      skipped += 1;
      continue;
    }

    const result = await repo.assignVoucher({
      userId: customer.id,
      couponId,
      source: 'BIRTHDAY',
      expiresAt: addDays(now, 30).toISOString(),
      oncePerYear: true,
    });

    if (result.already_assigned) alreadyAssigned += 1;
    else issued += 1;
  }

  return {
    month,
    customers: customers.length,
    issued,
    already_assigned: alreadyAssigned,
    skipped,
  };
}

/* ------------------------------------------------------------------ */
/* M07-F07 — Lịch sử điểm và quét hết hạn                             */
/* ------------------------------------------------------------------ */

/** API-M07-03 — nhật ký cộng/trừ điểm có phân trang. */
export async function getPointHistory({ userId, page, limit }) {
  const pagination = parsePagination({ page, limit });
  const { rows, total } = await repo.listPointTransactions(userId, {
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return {
    ...buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
    history: rows.map((row) => ({
      id: row.id,
      change: toNumber(row.points),
      type: row.transaction_type,
      reason: row.description ?? TRANSACTION_LABELS[row.transaction_type] ?? 'Biến động điểm',
      order_id: row.order_id,
      balance_after: toNumber(row.balance_after),
      created_at: row.created_at,
      expires_at: row.expires_at ?? null,
    })),
  };
}

/** Cron 01:00 — quét điểm quá hạn và ghi ledger EXPIRE. */
export async function expireLoyaltyPoints(now = new Date()) {
  return repo.expirePoints(now);
}
