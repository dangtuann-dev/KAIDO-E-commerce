import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

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

async function callRpc(name, args) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (error) throw fromSupabaseError(error);
  return data;
}

/** PostgREST `or` cần escape ký tự phân tách của bộ lọc. */
function safeKeyword(keyword) {
  return String(keyword ?? '')
    .replace(/[,()%*\\]/g, ' ')
    .trim();
}

const BANNER_COLUMNS =
  'id,title,image_url,mobile_image_url,link_url,position,sort_order,status,start_at,end_at,is_active,created_by,created_at,updated_at,deleted_at';

const ARTICLE_COLUMNS =
  'id,title,slug,excerpt,content,cover_image_url,category_id,author_id,status,published_at,view_count,meta_title,meta_description,created_at,updated_at,deleted_at';

const CAMPAIGN_COLUMNS =
  'id,name,slug,campaign_type,description,starts_at,ends_at,status,banner_id,created_by,created_at,updated_at';

const COUPON_COLUMNS =
  'id,code,name,description,discount_type,discount_value,max_discount_amount,min_order_amount,scope,applicable_targets,usage_limit,usage_limit_per_user,used_count,valid_from,valid_to,is_active,created_by,created_at,updated_at,deleted_at';

/* ------------------------------------------------------------------ */
/* Banner (M09-F01, F05, F07)                                          */
/* ------------------------------------------------------------------ */

/** Banner đang hiển thị: PUBLISHED, bật, chưa xóa và nằm trong khung giờ. */
export async function listActiveBanners({ position = null, limit = 5, now = new Date() } = {}) {
  const stamp = now.toISOString();
  let query = table('banners')
    .select(BANNER_COLUMNS)
    .eq('status', 'PUBLISHED')
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`start_at.is.null,start_at.lte.${stamp}`)
    .or(`end_at.is.null,end_at.gte.${stamp}`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (position) query = query.eq('position', position);
  return run(query);
}

export async function listBanners({ keyword, position, status, limit, offset }) {
  let query = table('banners')
    .select(BANNER_COLUMNS, { count: 'exact' })
    .is('deleted_at', null)
    .order('position', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (position) query = query.eq('position', position);
  if (status) query = query.eq('status', status);
  const search = safeKeyword(keyword);
  if (search) query = query.ilike('title', `%${search}%`);
  return runWithCount(query);
}

export async function findBannerById(id, { includeDeleted = false } = {}) {
  let query = table('banners').select(BANNER_COLUMNS).eq('id', id);
  if (!includeDeleted) query = query.is('deleted_at', null);
  return run(query.maybeSingle());
}

/** BR-M09-04 — đếm banner HOME_HERO đang bật (trigger DB là chốt chặn cuối). */
export async function countActiveHomeHeroBanners({ excludeId = null } = {}) {
  let query = table('banners')
    .select('id', { count: 'exact', head: true })
    .eq('position', 'HOME_HERO')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (excludeId) query = query.neq('id', excludeId);
  const { count, error } = await query;
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

export async function insertBanner(data) {
  return run(table('banners').insert(data).select(BANNER_COLUMNS).single());
}

export async function updateBannerRow(id, patch) {
  return run(
    table('banners')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(BANNER_COLUMNS)
      .maybeSingle(),
  );
}

export async function softDeleteBannerRow(id) {
  return run(
    table('banners')
      .update({ deleted_at: new Date().toISOString(), is_active: false, status: 'ARCHIVED' })
      .eq('id', id)
      .select('id,deleted_at')
      .maybeSingle(),
  );
}

/* ------------------------------------------------------------------ */
/* Bài viết (M09-F02, F07)                                             */
/* ------------------------------------------------------------------ */

export async function listArticleCategories({ includeInactive = false } = {}) {
  let query = table('article_categories')
    .select('id,name,slug,sort_order,is_active,created_at,updated_at')
    .order('sort_order', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findArticleCategoryBySlug(slug) {
  return run(
    table('article_categories')
      .select('id,name,slug,is_active')
      .eq('slug', slug)
      .maybeSingle(),
  );
}

export async function findArticleCategoryById(id) {
  return run(table('article_categories').select('id,name,slug,is_active').eq('id', id).maybeSingle());
}

/** Điều kiện danh mục cần `!inner` để lọc được bảng cha (PostgREST). */
function articleSelect(categorySlug) {
  const embed = categorySlug
    ? 'category:article_categories!inner(id,name,slug)'
    : 'category:article_categories(id,name,slug)';
  return `${ARTICLE_COLUMNS},${embed}`;
}

export async function listPublishedArticles({ categorySlug = null, limit, offset }) {
  const query = table('articles')
    .select(articleSelect(categorySlug), { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .is('deleted_at', null)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return runWithCount(categorySlug ? query.eq('category.slug', categorySlug) : query);
}

export async function listArticles({ keyword, status, categorySlug, limit, offset }) {
  let query = table('articles')
    .select(articleSelect(categorySlug), { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (categorySlug) query = query.eq('category.slug', categorySlug);
  const search = safeKeyword(keyword);
  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  return runWithCount(query);
}

/** Slug công khai chỉ trả bài đã publish; admin tra theo id hoặc slug bất kỳ trạng thái. */
export async function findArticleBySlug(slug) {
  return run(
    table('articles')
      .select(`${ARTICLE_COLUMNS},category:article_categories(id,name,slug)`)
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .maybeSingle(),
  );
}

export async function findArticleById(id, { includeDeleted = false } = {}) {
  let query = table('articles')
    .select(`${ARTICLE_COLUMNS},category:article_categories(id,name,slug)`)
    .eq('id', id);
  if (!includeDeleted) query = query.is('deleted_at', null);
  return run(query.maybeSingle());
}

export async function findArticleBySlugAny(slug, { excludeId = null } = {}) {
  let query = table('articles').select('id,slug').eq('slug', slug).is('deleted_at', null);
  if (excludeId) query = query.neq('id', excludeId);
  return run(query.maybeSingle());
}

/** Đếm lượt xem: đọc rồi ghi +1 (không cần ACID, sai số chấp nhận được). */
export async function increaseArticleViewCount(id, currentCount) {
  return run(
    table('articles')
      .update({ view_count: Number(currentCount ?? 0) + 1 })
      .eq('id', id)
      .select('id,view_count')
      .maybeSingle(),
  );
}

export async function insertArticle(data) {
  return run(table('articles').insert(data).select(ARTICLE_COLUMNS).single());
}

export async function updateArticleRow(id, patch) {
  return run(
    table('articles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ARTICLE_COLUMNS)
      .maybeSingle(),
  );
}

export async function softDeleteArticleRow(id) {
  return run(
    table('articles')
      .update({ deleted_at: new Date().toISOString(), status: 'ARCHIVED' })
      .eq('id', id)
      .select('id,deleted_at')
      .maybeSingle(),
  );
}

/* ------------------------------------------------------------------ */
/* Chiến dịch (M09-F03, F05, F07)                                      */
/* ------------------------------------------------------------------ */

const CAMPAIGN_ITEM_COLUMNS =
  'id,campaign_id,product_id,variant_id,sale_price,quantity_limit,sold_count,created_at,' +
  'product:products(id,name,slug,price_regular,price_sale,status),' +
  'variant:product_variants(id,sku,name,image_url)';

/** Chiến dịch đang chạy cho storefront, kèm banner và SKU flash sale. */
export async function listActiveCampaigns({ limit = 10, now = new Date() } = {}) {
  const stamp = now.toISOString();
  return run(
    table('campaigns')
      .select(
        `${CAMPAIGN_COLUMNS},banner:banners!banner_id(id,title,image_url,link_url),items:campaign_items(${CAMPAIGN_ITEM_COLUMNS})`,
      )
      .in('status', ['ACTIVE', 'SCHEDULED'])
      .lte('starts_at', stamp)
      .gte('ends_at', stamp)
      .order('starts_at', { ascending: true })
      .limit(limit),
  );
}

export async function listCampaigns({ keyword, status, type, limit, offset }) {
  let query = table('campaigns')
    .select(`${CAMPAIGN_COLUMNS},items:campaign_items(id,sale_price,sold_count,quantity_limit)`, {
      count: 'exact',
    })
    .order('starts_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('campaign_type', type);
  const search = safeKeyword(keyword);
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  return runWithCount(query);
}

export async function findCampaignById(id) {
  return run(
    table('campaigns')
      .select(
        `${CAMPAIGN_COLUMNS},banner:banners!banner_id(id,title,image_url,link_url),items:campaign_items(${CAMPAIGN_ITEM_COLUMNS})`,
      )
      .eq('id', id)
      .maybeSingle(),
  );
}

export async function findCampaignBySlug(slug, { excludeId = null } = {}) {
  let query = table('campaigns').select('id,slug').eq('slug', slug);
  if (excludeId) query = query.neq('id', excludeId);
  return run(query.maybeSingle());
}

export async function listCampaignItems(campaignId) {
  return run(
    table('campaign_items')
      .select(CAMPAIGN_ITEM_COLUMNS)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true }),
  );
}

export async function insertCampaign(data) {
  return run(table('campaigns').insert(data).select(CAMPAIGN_COLUMNS).single());
}

export async function updateCampaignRow(id, patch) {
  return run(
    table('campaigns')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(CAMPAIGN_COLUMNS)
      .maybeSingle(),
  );
}

/** Hoàn tác khi tạo chiến dịch lỗi giữa đường (campaigns không có deleted_at). */
export async function hardDeleteCampaignRow(id) {
  await run(table('campaigns').delete().eq('id', id));
}

export async function replaceCampaignItems(campaignId, rows) {
  await run(table('campaign_items').delete().eq('campaign_id', campaignId));
  if (rows.length === 0) return [];
  return run(
    table('campaign_items')
      .insert(rows.map((row) => ({ ...row, campaign_id: campaignId })))
      .select('id,product_id,variant_id,sale_price,quantity_limit'),
  );
}

/** M09-F05 — cron quét chiến dịch tới giờ bắt đầu / quá giờ kết thúc. */
export async function listCampaignsAwaitingActivation(nowStamp) {
  return run(
    table('campaigns')
      .select('id,status')
      .eq('status', 'SCHEDULED')
      .lte('starts_at', nowStamp)
      .gte('ends_at', nowStamp),
  );
}

export async function listCampaignsAwaitingEnd(nowStamp) {
  return run(
    table('campaigns')
      .select('id,status')
      .in('status', ['ACTIVE', 'SCHEDULED'])
      .lt('ends_at', nowStamp),
  );
}

export async function bulkUpdateCampaignStatus(ids, status) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const rows = await run(
    table('campaigns')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select('id'),
  );
  return (rows ?? []).length;
}

/* ------------------------------------------------------------------ */
/* Coupon (M09-F04, F08)                                               */
/* ------------------------------------------------------------------ */

export async function listPublicCoupons({ limit = 12, now = new Date() } = {}) {
  const stamp = now.toISOString();
  return run(
    table('coupons')
      .select(COUPON_COLUMNS)
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('valid_from', stamp)
      .gte('valid_to', stamp)
      .order('valid_to', { ascending: true })
      .limit(limit),
  );
}

/** status: ACTIVE | INACTIVE | EXPIRED | UPCOMING — lọc theo cờ và khung hiệu lực. */
export async function listCoupons({ status, keyword, limit, offset, now = new Date() }) {
  const stamp = now.toISOString();
  let query = table('coupons')
    .select(`${COUPON_COLUMNS},usages:coupon_usages(count)`, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === 'ACTIVE') {
    query = query.eq('is_active', true).lte('valid_from', stamp).gte('valid_to', stamp);
  } else if (status === 'INACTIVE') {
    query = query.eq('is_active', false);
  } else if (status === 'EXPIRED') {
    query = query.lt('valid_to', stamp);
  } else if (status === 'UPCOMING') {
    query = query.gt('valid_from', stamp);
  }

  const search = safeKeyword(keyword);
  if (search) query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
  return runWithCount(query);
}

export async function findCouponByCode(code) {
  return run(
    table('coupons').select(COUPON_COLUMNS).eq('code', code).is('deleted_at', null).maybeSingle(),
  );
}

export async function findCouponById(id, { includeDeleted = false } = {}) {
  let query = table('coupons').select(COUPON_COLUMNS).eq('id', id);
  if (!includeDeleted) query = query.is('deleted_at', null);
  return run(query.maybeSingle());
}

/** M09-F04 — đọc nhanh danh mục sản phẩm để kiểm tra phạm vi coupon CATEGORY. */
export async function listProductCategoryMap(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  return run(table('products').select('id,category_id').in('id', productIds));
}

export async function countCouponUsagesByUser(couponId, userId) {
  if (!userId) return 0;
  const { count, error } = await table('coupon_usages')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .eq('user_id', userId);
  if (error) throw fromSupabaseError(error);
  return count ?? 0;
}

export async function insertCoupon(data) {
  return run(table('coupons').insert(data).select(COUPON_COLUMNS).single());
}

export async function updateCouponRow(id, patch) {
  return run(
    table('coupons')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(COUPON_COLUMNS)
      .maybeSingle(),
  );
}

export async function softDeleteCouponRow(id) {
  return run(
    table('coupons')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('id,deleted_at')
      .maybeSingle(),
  );
}

/** M09-F08 — ghi nhận lượt dùng nguyên tử (migration 003). */
export async function consumeCouponRpc({ couponId, orderId, userId, discountAmount }) {
  return callRpc('m09_consume_coupon', {
    p_coupon_id: couponId,
    p_order_id: orderId,
    p_user_id: userId ?? null,
    p_discount_amount: discountAmount ?? 0,
  });
}

/** M09-F08 — hoàn lượt dùng khi hủy đơn (migration 003). */
export async function releaseCouponRpc({ couponId, orderId }) {
  return callRpc('m09_release_coupon', {
    p_coupon_id: couponId,
    p_order_id: orderId,
  });
}

/* ------------------------------------------------------------------ */
/* Cron trạng thái nội dung (M09-F05)                                  */
/* ------------------------------------------------------------------ */

/** Bật banner SCHEDULED tới giờ bắt đầu (và đã có lịch). */
export async function publishScheduledBanners(nowStamp) {
  return run(
    table('banners')
      .update({ status: 'PUBLISHED', is_active: true, updated_at: new Date().toISOString() })
      .eq('status', 'SCHEDULED')
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('start_at', nowStamp)
      .select('id'),
  );
}

/** Lưu trữ banner đã quá end_at. */
export async function archiveExpiredBanners(nowStamp) {
  return run(
    table('banners')
      .update({ status: 'ARCHIVED', is_active: false, updated_at: new Date().toISOString() })
      .eq('status', 'PUBLISHED')
      .lt('end_at', nowStamp)
      .is('deleted_at', null)
      .select('id'),
  );
}

/** Xuất bản bài viết SCHEDULED tới hạn. */
export async function publishScheduledArticles(nowStamp) {
  return run(
    table('articles')
      .update({
        status: 'PUBLISHED',
        published_at: nowStamp,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'DRAFT')
      .not('published_at', 'is', null)
      .lte('published_at', nowStamp)
      .is('deleted_at', null)
      .select('id'),
  );
}

/** Cron cần đọc bài DRAFT đã tới lịch để trả về số lượng đã xuất bản. */
export async function listArticlesAwaitingPublish(nowStamp) {
  return run(
    table('articles')
      .select('id,status,published_at')
      .eq('status', 'DRAFT')
      .not('published_at', 'is', null)
      .lte('published_at', nowStamp)
      .is('deleted_at', null),
  );
}
