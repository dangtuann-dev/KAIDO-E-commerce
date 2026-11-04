import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M07 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'membership_tiers',
  'loyalty_accounts',
  'loyalty_point_transactions',
  'customer_vouchers',
  'coupons',
  'coupon_usages',
]);

const ACCOUNT_COLUMNS =
  'user_id,tier_code,total_points,available_points,lifetime_spend,rolling_spend_12m,tier_updated_at,created_at,updated_at';
const TRANSACTION_COLUMNS =
  'id,user_id,order_id,transaction_type,points,balance_after,expires_at,description,created_at';
const VOUCHER_COLUMNS = 'id,user_id,coupon_id,status,source,assigned_at,used_at,expires_at,created_at';
const TIER_COLUMNS = 'code,name,min_spend,max_spend,point_multiplier,benefits,sort_order';
const COUPON_EMBED_COLUMNS =
  'id,code,name,description,discount_type,discount_value,max_discount_amount,min_order_amount,scope,valid_from,valid_to,is_active,deleted_at';

/** Repository chỉ ánh xạ dữ liệu; business rule nằm ở service. */
const table = (name) => getSupabaseAdmin().from(name);

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return data;
}

async function runWithCount(builder) {
  const { data, error, count } = await builder;
  if (error) throw fromSupabaseError(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Gọi RPC M07. Migration 005 có thể chưa được chạy: trả `missing: true` để
 * service dùng đường dự phòng PostgREST thay vì chặn toàn bộ tính năng.
 */
async function callRpc(name, args) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (!error) return { missing: false, data };

  const missing =
    error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '');
  if (missing) return { missing: true, data: null };
  throw fromSupabaseError(error);
}

/* ------------------------------------------------------------------ */
/* loyalty_accounts — M07-F03, M07-F05                                 */
/* ------------------------------------------------------------------ */

export async function findLoyaltyAccount(userId) {
  return run(
    table('loyalty_accounts').select(ACCOUNT_COLUMNS).eq('user_id', userId).maybeSingle(),
  );
}

export async function ensureLoyaltyAccount(userId) {
  const existing = await findLoyaltyAccount(userId);
  if (existing) return existing;

  const { error } = await table('loyalty_accounts')
    .insert({ user_id: userId, tier_code: 'BRONZE' })
    .select(ACCOUNT_COLUMNS)
    .maybeSingle();

  // 23505: request song song đã tạo trước — đọc lại dòng vừa tạo.
  if (error && error.code !== '23505') throw fromSupabaseError(error);
  return findLoyaltyAccount(userId);
}

export async function updateLoyaltyAccount(userId, patch) {
  return run(
    table('loyalty_accounts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select(ACCOUNT_COLUMNS)
      .maybeSingle(),
  );
}

/**
 * Cập nhật số dư bằng compare-and-set; dùng khi migration 005 chưa chạy.
 * Trả null nếu ghi thất bại do cạnh tranh (caller thử lại).
 */
async function casAdjustPoints(account, next, patch = {}) {
  return run(
    table('loyalty_accounts')
      .update({ ...patch, ...next, updated_at: new Date().toISOString() })
      .eq('user_id', account.user_id)
      .eq('available_points', account.available_points)
      .eq('total_points', account.total_points)
      .select(ACCOUNT_COLUMNS)
      .maybeSingle(),
  );
}

async function adjustPointsFallback(userId, { delta, totalDelta = 0 }) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const account = (await findLoyaltyAccount(userId)) ?? (await ensureLoyaltyAccount(userId));
    if (!account) break;

    const nextAvailable = Number(account.available_points) + delta;
    if (nextAvailable < 0) {
      return { ok: false, reason: 'INSUFFICIENT_POINTS', account };
    }

    const updated = await casAdjustPoints(account, {
      available_points: nextAvailable,
      total_points: Number(account.total_points) + totalDelta,
    });
    if (updated) return { ok: true, account: updated };
  }
  return { ok: false, reason: 'CONCURRENT_UPDATE', account: null };
}

/* ------------------------------------------------------------------ */
/* loyalty_point_transactions — M07-F03/F04/F07                       */
/* ------------------------------------------------------------------ */

export async function appendPointTransaction(data) {
  return run(table('loyalty_point_transactions').insert(data).select(TRANSACTION_COLUMNS).single());
}

export async function findOrderTransaction(orderId, transactionType) {
  return run(
    table('loyalty_point_transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('order_id', orderId)
      .eq('transaction_type', transactionType)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  );
}

export async function listPointTransactions(userId, { limit, offset }) {
  return runWithCount(
    table('loyalty_point_transactions')
      .select(TRANSACTION_COLUMNS, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1),
  );
}

/** Tổng điểm EARN còn hạn trong khoảng tới `beforeDate` trừ điểm đã EXPIRE. */
export async function sumExpiringPoints(userId, beforeDate) {
  const [earned, expired] = await Promise.all([
    run(
      table('loyalty_point_transactions')
        .select('points')
        .eq('user_id', userId)
        .eq('transaction_type', 'EARN')
        .not('expires_at', 'is', null)
        .lte('expires_at', beforeDate.toISOString()),
    ),
    run(
      table('loyalty_point_transactions')
        .select('points')
        .eq('user_id', userId)
        .eq('transaction_type', 'EXPIRE'),
    ),
  ]);

  const earnedSum = earned.reduce((sum, row) => sum + Number(row.points ?? 0), 0);
  const expiredSum = expired.reduce((sum, row) => sum + Math.abs(Number(row.points ?? 0)), 0);
  return Math.max(0, earnedSum - expiredSum);
}

export async function sumEarnedAndExpired(userId, beforeDate) {
  const [earned, expired] = await Promise.all([
    run(
      table('loyalty_point_transactions')
        .select('points')
        .eq('user_id', userId)
        .eq('transaction_type', 'EARN')
        .not('expires_at', 'is', null)
        .lte('expires_at', beforeDate.toISOString()),
    ),
    run(
      table('loyalty_point_transactions')
        .select('points')
        .eq('user_id', userId)
        .eq('transaction_type', 'EXPIRE'),
    ),
  ]);

  return {
    earned: earned.reduce((sum, row) => sum + Number(row.points ?? 0), 0),
    expired: expired.reduce((sum, row) => sum + Math.abs(Number(row.points ?? 0)), 0),
  };
}

/* ------------------------------------------------------------------ */
/* customer_vouchers — M07-F06                                        */
/* ------------------------------------------------------------------ */

export async function listCustomerVouchers(userId, status = null) {
  let query = table('customer_vouchers')
    .select(`${VOUCHER_COLUMNS},coupon:coupons(${COUPON_EMBED_COLUMNS})`)
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (status) query = query.eq('status', status);
  return run(query);
}

export async function assignCustomerVoucher(data) {
  return run(
    table('customer_vouchers').insert(data).select(VOUCHER_COLUMNS).maybeSingle(),
  );
}

export async function findCustomerVoucherInYear(userId, couponId, source) {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  return run(
    table('customer_vouchers')
      .select(VOUCHER_COLUMNS)
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .eq('source', source)
      .gte('assigned_at', yearStart)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function markCustomerVoucherUsed(id) {
  return run(
    table('customer_vouchers')
      .update({ status: 'USED', used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(VOUCHER_COLUMNS)
      .maybeSingle(),
  );
}

/* ------------------------------------------------------------------ */
/* membership_tiers — M07-F05                                          */
/* ------------------------------------------------------------------ */

export async function listMembershipTiers() {
  return run(table('membership_tiers').select(TIER_COLUMNS).order('sort_order', { ascending: true }));
}

/** Đếm thành viên theo hạng; PostgREST không GROUP BY nên đếm song song từng hạng. */
export async function listTierSummary() {
  const tiers = await listMembershipTiers();
  const counts = await Promise.all(
    tiers.map((tier) =>
      table('loyalty_accounts')
        .select('user_id', { count: 'exact', head: true })
        .eq('tier_code', tier.code),
    ),
  );

  return tiers.map((tier, index) => {
    const { error, count } = counts[index];
    if (error) throw fromSupabaseError(error);
    return {
      tier: tier.code,
      name: tier.name,
      member_count: count ?? 0,
      min_spent: Number(tier.min_spend ?? 0),
      max_spent: tier.max_spend == null ? null : Number(tier.max_spend),
      point_multiplier: Number(tier.point_multiplier ?? 1),
      benefits: tier.benefits ?? {},
    };
  });
}

/* ------------------------------------------------------------------ */
/* RPC nguyên tử (migration 005) + đường dự phòng                      */
/* ------------------------------------------------------------------ */

export async function awardPoints({ userId, orderId, points, expiresAt, description }) {
  const rpc = await callRpc('m07_award_points', {
    p_user_id: userId,
    p_order_id: orderId,
    p_points: points,
    p_expires_at: expiresAt,
    p_description: description,
  });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  const existing = await findOrderTransaction(orderId, 'EARN');
  const account = await ensureLoyaltyAccount(userId);
  if (existing) {
    return {
      awarded: false,
      already_awarded: true,
      points: 0,
      balance_after: account?.available_points ?? 0,
      source: 'fallback',
    };
  }

  const result = await adjustPointsFallback(userId, { delta: points, totalDelta: points });
  if (!result.ok) return { awarded: false, error: result.reason, source: 'fallback' };

  await appendPointTransaction({
    user_id: userId,
    order_id: orderId,
    transaction_type: 'EARN',
    points,
    balance_after: result.account.available_points,
    expires_at: expiresAt,
    description: description ?? 'Tích điểm đơn hàng hoàn tất',
  });

  return {
    awarded: true,
    already_awarded: false,
    points,
    balance_after: result.account.available_points,
    source: 'fallback',
  };
}

export async function redeemPoints({ userId, orderId, points, description }) {
  const rpc = await callRpc('m07_redeem_points', {
    p_user_id: userId,
    p_order_id: orderId,
    p_points: points,
    p_description: description,
  });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  const existing = await findOrderTransaction(orderId, 'REDEEM');
  const account = await ensureLoyaltyAccount(userId);
  if (existing) {
    return {
      redeemed: false,
      already_redeemed: true,
      points: 0,
      balance_after: account?.available_points ?? 0,
      source: 'fallback',
    };
  }

  const result = await adjustPointsFallback(userId, { delta: -points });
  if (!result.ok) return { redeemed: false, error: result.reason, source: 'fallback' };

  await appendPointTransaction({
    user_id: userId,
    order_id: orderId,
    transaction_type: 'REDEEM',
    points: -points,
    balance_after: result.account.available_points,
    description: description ?? 'Sử dụng điểm cho đơn hàng',
  });

  return {
    redeemed: true,
    already_redeemed: false,
    points,
    balance_after: result.account.available_points,
    source: 'fallback',
  };
}

export async function refundPoints({ userId, orderId }) {
  const rpc = await callRpc('m07_refund_points', {
    p_user_id: userId,
    p_order_id: orderId,
  });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  const redeemed = await findOrderTransaction(orderId, 'REDEEM');
  if (!redeemed) return { refunded: false, points: 0, balance_after: null, source: 'fallback' };

  const account = await ensureLoyaltyAccount(userId);
  const already = await findOrderTransaction(orderId, 'REFUND');
  if (already) {
    return {
      refunded: false,
      already_refunded: true,
      points: 0,
      balance_after: account?.available_points ?? 0,
      source: 'fallback',
    };
  }

  const points = Math.abs(Number(redeemed.points ?? 0));
  const result = await adjustPointsFallback(userId, { delta: points });
  if (!result.ok) return { refunded: false, error: result.reason, source: 'fallback' };

  await appendPointTransaction({
    user_id: userId,
    order_id: orderId,
    transaction_type: 'REFUND',
    points,
    balance_after: result.account.available_points,
    description: 'Hoàn điểm do hủy đơn hàng',
  });

  return {
    refunded: true,
    already_refunded: false,
    points,
    balance_after: result.account.available_points,
    source: 'fallback',
  };
}

export async function expirePoints(now = new Date()) {
  const rpc = await callRpc('m07_expire_points', { p_now: now.toISOString() });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  const accounts = await run(
    table('loyalty_accounts').select(ACCOUNT_COLUMNS).order('user_id', { ascending: true }),
  );

  let expiredPoints = 0;
  let affectedUsers = 0;

  for (const account of accounts) {
    if (Number(account.available_points) <= 0) continue;

    const { earned, expired } = await sumEarnedAndExpired(account.user_id, now);
    const remaining = earned - expired;
    if (remaining <= 0) continue;

    const deduct = Math.min(remaining, Number(account.available_points));
    const result = await adjustPointsFallback(account.user_id, { delta: -deduct });
    if (!result.ok) continue;

    await appendPointTransaction({
      user_id: account.user_id,
      transaction_type: 'EXPIRE',
      points: -deduct,
      balance_after: result.account.available_points,
      description: 'Điểm hết hạn theo chính sách 365 ngày',
    });

    expiredPoints += deduct;
    affectedUsers += 1;
  }

  return {
    expired_points: expiredPoints,
    affected_users: affectedUsers,
    ran_at: now.toISOString(),
    source: 'fallback',
  };
}

export async function evaluateTier(userId) {
  const rpc = await callRpc('m07_evaluate_tier', { p_user_id: userId });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .select('total_amount,status,completed_at,updated_at')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED');
  if (error) throw fromSupabaseError(error);

  const rows = data ?? [];
  const lifetime = rows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const rolling = rows.reduce((sum, row) => {
    const stamp = Date.parse(row.completed_at ?? row.updated_at ?? '');
    return stamp >= since.getTime() ? sum + Number(row.total_amount ?? 0) : sum;
  }, 0);

  const tiers = await listMembershipTiers();
  const tier =
    [...tiers].reverse().find((row) => rolling >= Number(row.min_spend ?? 0)) ?? tiers[0];

  await ensureLoyaltyAccount(userId);
  await updateLoyaltyAccount(userId, {
    tier_code: tier.code,
    lifetime_spend: lifetime,
    rolling_spend_12m: rolling,
    tier_updated_at: new Date().toISOString(),
  });

  return {
    user_id: userId,
    tier_code: tier.code,
    tier_name: tier.name,
    point_multiplier: Number(tier.point_multiplier ?? 1),
    lifetime_spend: lifetime,
    rolling_spend_12m: rolling,
    source: 'fallback',
  };
}

export async function assignVoucher({ userId, couponId, source, expiresAt, oncePerYear = true }) {
  const rpc = await callRpc('m07_assign_voucher', {
    p_user_id: userId,
    p_coupon_id: couponId,
    p_source: source,
    p_expires_at: expiresAt,
    p_once_per_year: oncePerYear,
  });
  if (!rpc.missing) return { ...rpc.data, source: 'rpc' };

  if (oncePerYear) {
    const existing = await findCustomerVoucherInYear(userId, couponId, source);
    if (existing) return { voucher_id: existing.id, already_assigned: true, source: 'fallback' };
  }

  const created = await assignCustomerVoucher({
    user_id: userId,
    coupon_id: couponId,
    status: 'AVAILABLE',
    source,
    expires_at: expiresAt,
  });

  return { voucher_id: created?.id ?? null, already_assigned: false, source: 'fallback' };
}
