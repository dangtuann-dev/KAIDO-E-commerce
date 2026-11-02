import 'server-only';
import { AppError } from '@/server/http/errors.js';
import { buildPaginationMeta, parsePagination } from '@/server/http/pagination.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import { slugify } from '@/shared/utils/slugify.js';
import { listProductSnapshots } from '@/modules/m02-catalog/public.server.js';
import {
  ARTICLE_STATUS,
  BANNER_POSITIONS,
  CAMPAIGN_STATUS,
  CONTENT_STATUS,
  DEFAULT_BANNER_POSITION,
  DEFAULT_USAGE_LIMIT_PER_USER,
  MAX_HOME_HERO_BANNERS,
} from './constants.js';
import * as repo from './repository.js';

/**
 * [SERVER] M09 — nghiệp vụ nội dung, chiến dịch và CouponService.
 * SRS: TOY-M09 (M09-F01..F08). Repository chỉ ánh xạ dữ liệu; mọi quy tắc nằm ở đây.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(status, code, message, details) {
  return new AppError(code, message, { status, details });
}

function notFound(message = 'Không tìm thấy dữ liệu.') {
  return fail(404, ERROR_CODES.NOT_FOUND, message);
}

function conflict(message, details) {
  return fail(409, ERROR_CODES.CONFLICT, message, details);
}

function invalid(message, details) {
  return fail(422, ERROR_CODES.VALIDATION_ERROR, message, details);
}

function unavailable(message, details) {
  return fail(503, ERROR_CODES.SERVICE_UNAVAILABLE, message, details);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isUuid(value) {
  return UUID_PATTERN.test(String(value ?? '').trim());
}

/** Khung thời gian: end phải sau start (banner/campaign/coupon đều áp dụng). */
function assertWindow(startAt, endAt, { label = 'Thời gian kết thúc', required = false } = {}) {
  if (required && (!startAt || !endAt)) {
    throw invalid('Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.');
  }
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) {
    throw invalid(`${label} phải sau thời gian bắt đầu.`);
  }
}

/** Sinh slug duy nhất cho bài viết/chiến dịch (tối đa 200 ký tự theo schema). */
async function resolveUniqueSlug({ desired, fallback, findExisting, excludeId = null }) {
  const base = slugify(desired || fallback) || `m09-${Date.now().toString(36)}`;
  let candidate = base.slice(0, 180);
  let existing = await findExisting(candidate, excludeId);
  let attempt = 2;
  while (existing && attempt <= 20) {
    candidate = `${base.slice(0, 175)}-${attempt}`;
    existing = await findExisting(candidate, excludeId);
    attempt += 1;
  }
  if (existing) candidate = `${base.slice(0, 170)}-${Math.random().toString(36).slice(2, 8)}`;
  return candidate;
}

function pagedResult({ rows, total, page, limit, mapRow }) {
  return {
    items: rows.map(mapRow),
    ...buildPaginationMeta({ page, limit, total }),
  };
}

/* ------------------------------------------------------------------ */
/* DTO                                                                 */
/* ------------------------------------------------------------------ */

function mapBanner(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    mobile_image_url: row.mobile_image_url ?? null,
    target_url: row.link_url ?? null,
    position: row.position,
    display_order: toNumber(row.sort_order),
    status: row.status,
    start_time: row.start_at ?? null,
    end_time: row.end_at ?? null,
    is_active: row.is_active !== false,
    created_by: row.created_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapArticle(row, { withContent = false } = {}) {
  if (!row) return null;
  const metaTitle = row.meta_title ?? null;
  const metaDescription = row.meta_description ?? null;
  const dto = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    cover_image_url: row.cover_image_url ?? null,
    category_id: row.category_id ?? null,
    category: row.category
      ? { id: row.category.id, name: row.category.name, slug: row.category.slug }
      : null,
    status: row.status,
    published_at: row.published_at ?? null,
    view_count: toNumber(row.view_count),
    meta_title: metaTitle,
    meta_description: metaDescription,
    seo: {
      title: metaTitle ?? row.title,
      description: metaDescription ?? row.excerpt ?? null,
      image: row.cover_image_url ?? null,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (withContent) dto.content = row.content ?? '';
  return dto;
}

function mapCampaignItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    product_id: row.product_id,
    variant_id: row.variant_id ?? null,
    sale_price: toNumber(row.sale_price),
    quantity_limit: row.quantity_limit == null ? null : toNumber(row.quantity_limit),
    sold_count: toNumber(row.sold_count),
    product: row.product
      ? {
          id: row.product.id,
          name: row.product.name,
          slug: row.product.slug,
          price_regular: toNumber(row.product.price_regular),
          price_sale: row.product.price_sale == null ? null : toNumber(row.product.price_sale),
          status: row.product.status,
        }
      : null,
    variant: row.variant
      ? {
          id: row.variant.id,
          sku: row.variant.sku,
          name: row.variant.name,
          image_url: row.variant.image_url ?? null,
        }
      : null,
  };
}

function mapCampaign(row, { withItems = true } = {}) {
  if (!row) return null;
  const items = Array.isArray(row.items) ? row.items.map(mapCampaignItem) : [];
  const soldTotal = items.reduce((sum, item) => sum + item.sold_count, 0);
  return {
    id: row.id,
    campaign_id: row.id,
    name: row.name,
    title: row.name,
    slug: row.slug,
    campaign_type: row.campaign_type,
    description: row.description ?? null,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    start_date: row.starts_at,
    end_date: row.ends_at,
    banner_id: row.banner_id ?? null,
    banner: row.banner
      ? {
          id: row.banner.id,
          title: row.banner.title,
          image_url: row.banner.image_url,
          link_url: row.banner.link_url ?? null,
        }
      : null,
    banner_url: row.banner?.image_url ?? null,
    item_count: items.length,
    items_sold: soldTotal,
    ...(withItems ? { items } : {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** status suy ra từ cờ is_active + khung hiệu lực (BR-M09-01). */
function couponStatus(row, now = new Date()) {
  if (row.is_active === false) return 'INACTIVE';
  const validTo = row.valid_to ? Date.parse(row.valid_to) : null;
  const validFrom = row.valid_from ? Date.parse(row.valid_from) : null;
  const stamp = now.getTime();
  if (validTo != null && validTo < stamp) return 'EXPIRED';
  if (validFrom != null && validFrom > stamp) return 'UPCOMING';
  return 'ACTIVE';
}

function mapCoupon(row, { now = new Date() } = {}) {
  if (!row) return null;
  const usages = Array.isArray(row.usages) ? toNumber(row.usages[0]?.count) : null;
  return {
    coupon_id: row.id,
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    discount_type: row.discount_type,
    discount_value: toNumber(row.discount_value),
    max_discount_amount:
      row.max_discount_amount == null ? null : toNumber(row.max_discount_amount),
    min_order_amount: toNumber(row.min_order_amount),
    scope: row.scope ?? 'ALL',
    applicable_targets: Array.isArray(row.applicable_targets) ? row.applicable_targets : [],
    usage_limit: row.usage_limit == null ? null : toNumber(row.usage_limit),
    usage_limit_per_user:
      row.usage_limit_per_user == null ? null : toNumber(row.usage_limit_per_user),
    used_count: toNumber(row.used_count),
    actual_usage_count: usages,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    is_active: row.is_active !== false,
    status: couponStatus(row, now),
    created_by: row.created_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/* M09-F01 / M09-F07 — Banner                                          */
/* ------------------------------------------------------------------ */

/** Banner chỉ chiếm suất hiển thị khi thực sự được bật (BR-M09-04). */
function resolveBannerActive(status, isActive) {
  if (typeof isActive === 'boolean') return isActive;
  return status === CONTENT_STATUS.PUBLISHED || status === CONTENT_STATUS.SCHEDULED;
}

/** BR-M09-04 — chặn sớm trước khi trigger DB ném P0001. */
async function assertHomeHeroLimit({ position, isActive, excludeId = null }) {
  if (position !== BANNER_POSITIONS.HOME_HERO || !isActive) return;
  const count = await repo.countActiveHomeHeroBanners({ excludeId });
  if (count >= MAX_HOME_HERO_BANNERS) {
    throw conflict(
      `Chỉ được bật tối đa ${MAX_HOME_HERO_BANNERS} banner HOME_HERO (BR-M09-04). Hãy tắt bớt banner khác trước.`,
      { limit: MAX_HOME_HERO_BANNERS, current: count },
    );
  }
}

/** API-M09-01 — banner đang hiệu lực cho storefront. */
export async function getBanners({ position = null } = {}) {
  const rows = await repo.listActiveBanners({ position: position ?? null });
  return rows.map(mapBanner);
}

/** API-M09-04 — tạo banner (M09-F01, M09-F05). */
export async function createBanner({ body, auth }) {
  const status = body.status ?? CONTENT_STATUS.DRAFT;
  const position = body.position ?? DEFAULT_BANNER_POSITION;
  const isActive = resolveBannerActive(status, body.is_active);
  const startAt = body.start_time ?? null;
  const endAt = body.end_time ?? null;

  assertWindow(startAt, endAt);
  await assertHomeHeroLimit({ position, isActive });

  const created = await repo.insertBanner({
    title: body.title,
    image_url: body.image_url,
    mobile_image_url: body.mobile_image_url ?? null,
    link_url: body.target_url ?? null,
    position,
    sort_order: body.display_order ?? 0,
    status,
    start_at: startAt,
    end_at: endAt,
    is_active: isActive,
    created_by: auth?.userId ?? null,
  });

  return mapBanner(created);
}

/** API-M09-09 — bảng banner back-office (M09-F06). */
export async function listAdminBanners({ query = {} } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.listBanners({
    keyword: query.keyword,
    position: query.position ?? null,
    status: query.status ?? null,
    limit,
    offset,
  });
  return pagedResult({ rows, total, page, limit, mapRow: mapBanner });
}

/** API-M09-10 — sửa nội dung/lịch hiển thị banner (M09-F01, M09-F05). */
export async function updateBanner({ id, patch }) {
  const existing = await repo.findBannerById(id);
  if (!existing) throw notFound('Không tìm thấy banner.');

  const row = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.image_url !== undefined) row.image_url = patch.image_url;
  if (patch.mobile_image_url !== undefined) row.mobile_image_url = patch.mobile_image_url;
  if (patch.target_url !== undefined) row.link_url = patch.target_url;
  if (patch.position !== undefined) row.position = patch.position;
  if (patch.display_order !== undefined) row.sort_order = patch.display_order;
  if (patch.start_time !== undefined) row.start_at = patch.start_time;
  if (patch.end_time !== undefined) row.end_at = patch.end_time;
  if (patch.status !== undefined) row.status = patch.status;

  const nextStatus = patch.status ?? existing.status;
  let nextActive = existing.is_active !== false;
  if (patch.is_active !== undefined) nextActive = patch.is_active;
  else if (patch.status !== undefined && patch.status !== existing.status) {
    nextActive = resolveBannerActive(nextStatus, undefined);
  }
  row.is_active = nextActive;

  const startAt = patch.start_time !== undefined ? patch.start_time : existing.start_at;
  const endAt = patch.end_time !== undefined ? patch.end_time : existing.end_at;
  assertWindow(startAt, endAt);

  await assertHomeHeroLimit({
    position: row.position ?? existing.position,
    isActive: nextActive,
    excludeId: existing.id,
  });

  const updated = await repo.updateBannerRow(existing.id, row);
  if (!updated) throw notFound('Không tìm thấy banner.');
  return mapBanner(updated);
}

/** API-M09-11 — xóa mềm banner, giải phóng suất HOME_HERO (BR-M09-04). */
export async function deleteBanner({ id }) {
  const existing = await repo.findBannerById(id);
  if (!existing) throw notFound('Không tìm thấy banner.');
  const deleted = await repo.softDeleteBannerRow(existing.id);
  return { id: existing.id, deleted_at: deleted?.deleted_at ?? new Date().toISOString() };
}

/* ------------------------------------------------------------------ */
/* M09-F02 / M09-F07 — Bài viết                                        */
/* ------------------------------------------------------------------ */

/** M09-F05 — DRAFT + published_at tương lai là bài hẹn giờ xuất bản. */
function resolvePublishedAt({ status, requested, existing = null }) {
  if (status === ARTICLE_STATUS.PUBLISHED) {
    return requested ?? existing?.published_at ?? new Date().toISOString();
  }
  if (status === ARTICLE_STATUS.DRAFT) return requested ?? null;
  return existing?.published_at ?? null;
}

async function assertArticleCategory(categoryId) {
  if (!categoryId) return null;
  const category = await repo.findArticleCategoryById(categoryId);
  if (!category) throw invalid('Danh mục bài viết không tồn tại.');
  return category;
}

/** API-M09-06 — danh sách bài viết công khai (M09-F02, M09-F07). */
export async function listPublicArticles({ query = {} } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const categories = await repo.listArticleCategories();
  const { rows, total } = await repo.listPublishedArticles({
    categorySlug: query.category ?? null,
    limit,
    offset,
  });
  return {
    ...pagedResult({ rows, total, page, limit, mapRow: (row) => mapArticle(row) }),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  };
}

/** API-M09-07 — chi tiết bài viết theo slug hoặc id (M09-F02, M09-F07). */
export async function getArticleBySlug({ slug }) {
  const value = String(slug ?? '').trim();
  if (!value) throw invalid('Slug bài viết là bắt buộc.');

  const row = isUuid(value)
    ? await repo.findArticleById(value)
    : await repo.findArticleBySlug(value);

  if (!row || row.status !== ARTICLE_STATUS.PUBLISHED || row.deleted_at) {
    throw notFound('Không tìm thấy bài viết hoặc bài viết chưa được xuất bản.');
  }

  try {
    await repo.increaseArticleViewCount(row.id, row.view_count);
    row.view_count = toNumber(row.view_count) + 1;
  } catch {
    // Lượt xem là số liệu phụ — lỗi đếm không được làm hỏng trang bài viết.
  }

  return mapArticle(row, { withContent: true });
}

export async function listArticleCategoriesForAdmin() {
  const rows = await repo.listArticleCategories({ includeInactive: true });
  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    sort_order: toNumber(category.sort_order),
    is_active: category.is_active !== false,
  }));
}

/** API-M09-12 — bài viết mọi trạng thái cho back-office (M09-F06). */
export async function listAdminArticles({ query = {} } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.listArticles({
    keyword: query.keyword,
    status: query.status ?? null,
    categorySlug: query.category ?? null,
    limit,
    offset,
  });
  return {
    ...pagedResult({ rows, total, page, limit, mapRow: (row) => mapArticle(row) }),
    categories: await listArticleCategoriesForAdmin(),
  };
}

/** API-M09-24 — chi tiết bài viết cho back-office, kèm nội dung (M09-F02, F06). */
export async function getAdminArticle({ id }) {
  const row = await repo.findArticleById(id);
  if (!row) throw notFound('Không tìm thấy bài viết.');
  return mapArticle(row, { withContent: true });
}

/** API-M09-13 — tạo bài viết (M09-F02, NFR-M09-01). */
export async function createArticle({ body, auth }) {
  const status = body.status ?? ARTICLE_STATUS.DRAFT;
  await assertArticleCategory(body.category_id);

  const slug = await resolveUniqueSlug({
    desired: body.slug,
    fallback: body.title,
    findExisting: (candidate) => repo.findArticleBySlugAny(candidate),
  });

  const created = await repo.insertArticle({
    title: body.title,
    slug,
    excerpt: body.excerpt ?? null,
    content: body.content,
    cover_image_url: body.cover_image_url ?? null,
    category_id: body.category_id ?? null,
    author_id: auth?.userId ?? null,
    status,
    published_at: resolvePublishedAt({ status, requested: body.published_at }),
    meta_title: body.meta_title ?? null,
    meta_description: body.meta_description ?? null,
  });

  return mapArticle(created, { withContent: true });
}

/** API-M09-14 — biên tập/xuất bản/lưu trữ bài viết (M09-F02). */
export async function updateArticle({ id, patch }) {
  const existing = await repo.findArticleById(id);
  if (!existing) throw notFound('Không tìm thấy bài viết.');

  if (patch.category_id !== undefined && patch.category_id !== null) {
    await assertArticleCategory(patch.category_id);
  }

  const row = {};
  for (const field of ['title', 'excerpt', 'content', 'cover_image_url', 'category_id']) {
    if (patch[field] !== undefined) row[field] = patch[field];
  }
  for (const field of ['meta_title', 'meta_description']) {
    if (patch[field] !== undefined) row[field] = patch[field];
  }

  if (patch.slug !== undefined && patch.slug !== existing.slug) {
    row.slug = await resolveUniqueSlug({
      desired: patch.slug,
      fallback: patch.title ?? existing.title,
      findExisting: (candidate, excludeId) => repo.findArticleBySlugAny(candidate, { excludeId }),
      excludeId: existing.id,
    });
  }

  const nextStatus = patch.status ?? existing.status;
  row.status = nextStatus;
  if (patch.status !== undefined || patch.published_at !== undefined) {
    row.published_at = resolvePublishedAt({
      status: nextStatus,
      requested: patch.published_at,
      existing,
    });
  }

  const updated = await repo.updateArticleRow(existing.id, row);
  if (!updated) throw notFound('Không tìm thấy bài viết.');
  return mapArticle(updated, { withContent: true });
}

/** API-M09-15 — xóa mềm bài viết (M09-F02). */
export async function deleteArticle({ id }) {
  const existing = await repo.findArticleById(id);
  if (!existing) throw notFound('Không tìm thấy bài viết.');
  const deleted = await repo.softDeleteArticleRow(existing.id);
  return { id: existing.id, deleted_at: deleted?.deleted_at ?? new Date().toISOString() };
}

/* ------------------------------------------------------------------ */
/* M09-F03 / M09-F05 — Chiến dịch                                      */
/* ------------------------------------------------------------------ */

const CAMPAIGN_TRANSITIONS = Object.freeze({
  SCHEDULE: { from: ['DRAFT', 'ENDED', 'CANCELLED'], to: CAMPAIGN_STATUS.SCHEDULED },
  ACTIVATE: { from: ['DRAFT', 'SCHEDULED'], to: CAMPAIGN_STATUS.ACTIVE },
  END: { from: ['SCHEDULED', 'ACTIVE'], to: CAMPAIGN_STATUS.ENDED },
  CANCEL: { from: ['DRAFT', 'SCHEDULED', 'ACTIVE'], to: CAMPAIGN_STATUS.CANCELLED },
  DRAFT: { from: ['SCHEDULED', 'ENDED', 'CANCELLED'], to: CAMPAIGN_STATUS.DRAFT },
});

/** M02-F10 — xác thực SKU bằng hợp đồng công khai của M02. */
async function normalizeCampaignItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const unique = new Map();
  for (const item of items) {
    const key = `${item.product_id}:${item.variant_id ?? ''}`;
    if (unique.has(key)) {
      throw invalid('Danh sách sản phẩm chiến dịch bị trùng (cùng sản phẩm và biến thể).');
    }
    unique.set(key, item);
  }

  const productIds = [...new Set([...unique.values()].map((item) => item.product_id))];
  const snapshots = await listProductSnapshots(productIds);
  const byId = new Map(snapshots.map((product) => [product.product_id, product]));

  const rows = [];
  for (const item of unique.values()) {
    const product = byId.get(item.product_id);
    if (!product) throw invalid('Sản phẩm của chiến dịch không tồn tại.');
    if (product.status && product.status !== 'ACTIVE') {
      throw invalid(`Sản phẩm "${product.name}" đang ngừng bán, không thể đưa vào chiến dịch.`);
    }
    if (toNumber(product.price_regular) > 0 && item.sale_price >= toNumber(product.price_regular)) {
      throw invalid(
        `Giá flash sale của "${product.name}" phải thấp hơn giá niêm yết ${formatVND(product.price_regular)}.`,
      );
    }
    rows.push({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      sale_price: item.sale_price,
      quantity_limit: item.quantity_limit ?? null,
    });
  }
  return rows;
}

/** Trạng thái ban đầu suy ra từ khung giờ (M09-F05). */
function resolveInitialCampaignStatus(startsAt, endsAt, now = new Date()) {
  const stamp = now.getTime();
  if (Date.parse(endsAt) <= stamp) {
    throw invalid('Khung thời gian chiến dịch đã kết thúc, vui lòng chọn thời gian khác.');
  }
  return Date.parse(startsAt) <= stamp ? CAMPAIGN_STATUS.ACTIVE : CAMPAIGN_STATUS.SCHEDULED;
}

/** API-M09-02 — chiến dịch đang chạy cho storefront (M09-F03, M09-F07). */
export async function getActiveCampaigns() {
  const rows = await repo.listActiveCampaigns();
  return rows.map((row) => mapCampaign(row));
}

/** API-M09-16 — danh sách chiến dịch back-office (M09-F06). */
export async function listAdminCampaigns({ query = {} } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.listCampaigns({
    keyword: query.keyword,
    status: query.status ?? null,
    type: query.type ?? null,
    limit,
    offset,
  });
  return pagedResult({
    rows,
    total,
    page,
    limit,
    mapRow: (row) => mapCampaign(row, { withItems: false }),
  });
}

/** API-M09-18 — chi tiết chiến dịch kèm danh sách SKU (M09-F03). */
export async function getAdminCampaign({ id }) {
  const row = await repo.findCampaignById(id);
  if (!row) throw notFound('Không tìm thấy chiến dịch.');
  return mapCampaign(row);
}

/** API-M09-17 — tạo chiến dịch kèm SKU flash sale (M09-F03). */
export async function createCampaign({ body, auth }) {
  assertWindow(body.starts_at, body.ends_at, { label: 'Thời gian kết thúc', required: true });

  if (body.banner_id) {
    const banner = await repo.findBannerById(body.banner_id);
    if (!banner) throw invalid('Banner gắn với chiến dịch không tồn tại.');
  }

  const slug = await resolveUniqueSlug({
    desired: body.slug,
    fallback: body.name,
    findExisting: (candidate, excludeId) => repo.findCampaignBySlug(candidate, { excludeId }),
  });
  const itemRows = await normalizeCampaignItems(body.items ?? []);

  const created = await repo.insertCampaign({
    name: body.name,
    slug,
    campaign_type: body.campaign_type,
    description: body.description ?? null,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    status: resolveInitialCampaignStatus(body.starts_at, body.ends_at),
    banner_id: body.banner_id ?? null,
    created_by: auth?.userId ?? null,
  });

  // campaigns + campaign_items không nằm chung một transaction qua PostgREST:
  // ghi bù (compensating write) giống M02 createProduct.
  try {
    if (itemRows.length > 0) await repo.replaceCampaignItems(created.id, itemRows);
  } catch (error) {
    await repo.hardDeleteCampaignRow(created.id).catch(() => undefined);
    throw error;
  }

  const fresh = await repo.findCampaignById(created.id);
  return { ...mapCampaign(fresh), item_count: itemRows.length };
}

/** API-M09-19 — sửa thông tin/khung giờ/danh sách SKU (M09-F03). */
export async function updateCampaign({ id, patch }) {
  const existing = await repo.findCampaignById(id);
  if (!existing) throw notFound('Không tìm thấy chiến dịch.');
  if ([CAMPAIGN_STATUS.ENDED, CAMPAIGN_STATUS.CANCELLED].includes(existing.status)) {
    throw conflict('Chiến dịch đã kết thúc hoặc bị hủy, không thể chỉnh sửa.');
  }

  const row = {};
  for (const field of ['name', 'campaign_type', 'description']) {
    if (patch[field] !== undefined) row[field] = patch[field];
  }
  if (patch.banner_id !== undefined) {
    if (patch.banner_id) {
      const banner = await repo.findBannerById(patch.banner_id);
      if (!banner) throw invalid('Banner gắn với chiến dịch không tồn tại.');
    }
    row.banner_id = patch.banner_id;
  }
  if (patch.slug !== undefined && patch.slug !== existing.slug) {
    row.slug = await resolveUniqueSlug({
      desired: patch.slug,
      fallback: patch.name ?? existing.name,
      findExisting: (candidate, excludeId) => repo.findCampaignBySlug(candidate, { excludeId }),
      excludeId: existing.id,
    });
  }

  const startsAt = patch.starts_at ?? existing.starts_at;
  const endsAt = patch.ends_at ?? existing.ends_at;
  assertWindow(startsAt, endsAt, { label: 'Thời gian kết thúc', required: true });
  if (patch.starts_at !== undefined) row.starts_at = patch.starts_at;
  if (patch.ends_at !== undefined) row.ends_at = patch.ends_at;

  const itemRows = patch.items === undefined ? null : await normalizeCampaignItems(patch.items);

  const updated = await repo.updateCampaignRow(existing.id, row);
  if (!updated) throw notFound('Không tìm thấy chiến dịch.');

  if (itemRows !== null) await repo.replaceCampaignItems(existing.id, itemRows);

  const fresh = await repo.findCampaignById(existing.id);
  // Cùng shape với createCampaign để client không phải xử lý hai dạng phản hồi.
  return {
    ...mapCampaign(fresh),
    item_count: Array.isArray(fresh.items) ? fresh.items.length : 0,
  };
}

/** API-M09-20 — đổi trạng thái chiến dịch theo hành động (M09-F05). */
export async function changeCampaignStatus({ id, action, now = new Date() }) {
  const existing = await repo.findCampaignById(id);
  if (!existing) throw notFound('Không tìm thấy chiến dịch.');

  const transition = CAMPAIGN_TRANSITIONS[action];
  if (!transition) throw invalid('Hành động không hợp lệ.');
  if (!transition.from.includes(existing.status)) {
    throw conflict(
      `Không thể chuyển chiến dịch từ ${existing.status} sang ${transition.to}.`,
      { current_status: existing.status, allowed_from: transition.from },
    );
  }
  if (
    [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.ACTIVE].includes(transition.to) &&
    Date.parse(existing.ends_at) <= now.getTime()
  ) {
    throw invalid('Chiến dịch đã quá thời gian kết thúc, vui lòng cập nhật khung giờ trước.');
  }

  const updated = await repo.updateCampaignRow(existing.id, { status: transition.to });
  return { id: updated.id, status: updated.status, updated_at: updated.updated_at };
}

/* ------------------------------------------------------------------ */
/* M09-F04 — Coupon                                                    */
/* ------------------------------------------------------------------ */

/** API-M09-05 — tạo coupon chiến dịch (M09-F04). */
export async function createCoupon({ body, auth }) {
  const code = String(body.code ?? '').trim().toUpperCase();
  const existing = await repo.findCouponByCode(code);
  if (existing) throw conflict(`Mã giảm giá ${code} đã tồn tại.`);

  assertWindow(body.start_time, body.end_time, { label: 'Hiệu lực kết thúc', required: true });

  const created = await repo.insertCoupon({
    code,
    name: body.name ?? code,
    description: body.description ?? null,
    discount_type: body.type,
    discount_value: body.value,
    max_discount_amount: body.max_discount ?? null,
    min_order_amount: body.min_order ?? 0,
    scope: body.scope ?? 'ALL',
    applicable_targets: body.applicable_targets ?? [],
    usage_limit: body.usage_limit ?? null,
    usage_limit_per_user: body.usage_limit_per_user ?? DEFAULT_USAGE_LIMIT_PER_USER,
    valid_from: body.start_time,
    valid_to: body.end_time,
    is_active: true,
    created_by: auth?.userId ?? null,
  });

  const coupon = mapCoupon(created);
  return { coupon_id: coupon.coupon_id, code: coupon.code, status: coupon.status, coupon };
}

/** API-M09-21 — danh sách coupon back-office kèm lượt dùng (M09-F06). */
export async function listAdminCoupons({ query = {} } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await repo.listCoupons({
    status: query.status ?? null,
    keyword: query.keyword,
    limit,
    offset,
  });
  return pagedResult({ rows, total, page, limit, mapRow: (row) => mapCoupon(row) });
}

/** API-M09-08 — voucher công khai còn hiệu lực (M09-F04, M09-F07). */
export async function getPublicCoupons({ query = {} } = {}) {
  const limit = toNumber(query.limit) || 12;
  const rows = await repo.listPublicCoupons({ limit });
  return rows.map((row) => {
    const coupon = mapCoupon(row);
    return {
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount_amount: coupon.max_discount_amount,
      min_order_amount: coupon.min_order_amount,
      scope: coupon.scope,
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
      remaining: coupon.usage_limit == null ? null : Math.max(0, coupon.usage_limit - coupon.used_count),
    };
  });
}

/** API-M09-22 — sửa điều kiện/giới hạn/hiệu lực coupon (M09-F04). */
export async function updateCoupon({ id, patch, now = new Date() }) {
  const existing = await repo.findCouponById(id);
  if (!existing) throw notFound('Không tìm thấy mã giảm giá.');

  const row = {};
  for (const field of ['name', 'description', 'applicable_targets', 'usage_limit']) {
    if (patch[field] !== undefined) row[field] = patch[field];
  }
  if (patch.value !== undefined) row.discount_value = patch.value;
  if (patch.max_discount !== undefined) row.max_discount_amount = patch.max_discount;
  if (patch.min_order !== undefined) row.min_order_amount = patch.min_order;
  if (patch.usage_limit_per_user !== undefined) {
    row.usage_limit_per_user = patch.usage_limit_per_user;
  }
  if (patch.end_time !== undefined) row.valid_to = patch.end_time;
  if (patch.is_active !== undefined) row.is_active = patch.is_active;

  const nextValidTo = patch.end_time ?? existing.valid_to;
  assertWindow(existing.valid_from, nextValidTo, { label: 'Hiệu lực kết thúc', required: true });

  const nextUsageLimit = patch.usage_limit === undefined ? existing.usage_limit : patch.usage_limit;
  if (nextUsageLimit != null && toNumber(existing.used_count) > toNumber(nextUsageLimit)) {
    throw invalid(
      `Mã đã dùng ${existing.used_count} lượt, không thể đặt giới hạn thấp hơn.`,
    );
  }

  const nextType = existing.discount_type;
  const nextValue = patch.value === undefined ? toNumber(existing.discount_value) : patch.value;
  if (nextType === 'PERCENT' && (nextValue < 1 || nextValue > 100)) {
    throw invalid('Coupon PERCENT phải có giá trị 1–100.');
  }
  if (nextType === 'FIXED' && nextValue <= 0) {
    throw invalid('Coupon FIXED phải có giá trị lớn hơn 0.');
  }

  const updated = await repo.updateCouponRow(existing.id, row);
  if (!updated) throw notFound('Không tìm thấy mã giảm giá.');

  const coupon = mapCoupon(updated, { now });
  return {
    coupon_id: coupon.coupon_id,
    code: coupon.code,
    is_active: coupon.is_active,
    updated_at: coupon.updated_at,
    coupon,
  };
}

/** API-M09-23 — ngừng coupon, không áp dụng cho đơn mới (BR-M09-01). */
export async function deleteCoupon({ id }) {
  const existing = await repo.findCouponById(id);
  if (!existing) throw notFound('Không tìm thấy mã giảm giá.');
  const deleted = await repo.softDeleteCouponRow(existing.id);
  return {
    coupon_id: existing.id,
    code: existing.code,
    is_active: false,
    deleted_at: deleted?.deleted_at ?? new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* M09-F08 — CouponService (dùng chung M04/M05/M07)                    */
/* ------------------------------------------------------------------ */

function lineTotalOf(item) {
  const explicit = item?.line_total;
  if (explicit != null) return Math.max(0, toNumber(explicit));
  return Math.max(0, toNumber(item?.unit_price) * toNumber(item?.quantity));
}

/**
 * Phạm vi áp dụng (BR-M09-01): quy đổi sản phẩm trong giỏ sang danh mục để so
 * với `applicable_targets` — M04 không gửi category_id nên đọc bảng products.
 */
async function resolveCategoryIndex(items) {
  const index = new Map();
  const missing = [];
  for (const item of items) {
    const key = item.product_id ?? item.sku ?? '';
    if (!key) continue;
    if (item.category_id) index.set(key, item.category_id);
    else if (item.product_id) missing.push(item.product_id);
  }
  if (missing.length > 0) {
    const rows = await repo.listProductCategoryMap([...new Set(missing)]);
    for (const row of rows) if (!index.has(row.id)) index.set(row.id, row.category_id);
  }
  return index;
}

/** Tính phần tiền đủ điều kiện áp mã theo phạm vi. */
async function resolveEligibleBase(coupon, items, orderAmount) {
  const scope = coupon.scope ?? 'ALL';
  if (scope === 'ALL') return orderAmount;

  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    throw invalid('Cần thông tin sản phẩm trong đơn để áp mã giảm giá theo phạm vi.');
  }

  const targets = new Set((coupon.applicable_targets ?? []).map((value) => String(value)));

  if (scope === 'PRODUCT') {
    return list.reduce(
      (sum, item) => (item.product_id && targets.has(item.product_id) ? sum + lineTotalOf(item) : sum),
      0,
    );
  }

  if (scope === 'CATEGORY') {
    const categoryIndex = await resolveCategoryIndex(list);
    return list.reduce((sum, item) => {
      const key = item.product_id ?? item.sku ?? '';
      const categoryId = categoryIndex.get(key);
      return categoryId && targets.has(String(categoryId)) ? sum + lineTotalOf(item) : sum;
    }, 0);
  }

  return orderAmount;
}

function computeDiscount(coupon, base) {
  const value = toNumber(coupon.discount_value);
  if (coupon.discount_type === 'PERCENT') {
    const raw = Math.floor((base * value) / 100);
    const cap = coupon.max_discount_amount == null ? null : toNumber(coupon.max_discount_amount);
    return Math.max(0, cap == null ? raw : Math.min(raw, cap));
  }
  if (coupon.discount_type === 'FIXED') return Math.max(0, Math.min(Math.round(value), base));
  return 0;
}

/**
 * M09-F08 — kiểm tra coupon theo thứ tự: tồn tại → đang bật → khung hiệu lực →
 * lượt dùng → giá trị đơn tối thiểu → phạm vi (BR-M09-01, BR-M09-02).
 * Ném AppError với thông điệp tiếng Việt khi coupon không dùng được.
 */
async function evaluateCoupon({ code, orderAmount, userId = null, items = [] }) {
  const normalizedCode = String(code ?? '').trim().toUpperCase();
  const coupon = await repo.findCouponByCode(normalizedCode);
  if (!coupon) throw invalid('Mã giảm giá không tồn tại.');

  const stamp = Date.now();
  if (coupon.is_active === false) throw invalid('Mã giảm giá đã ngừng áp dụng.');
  if (coupon.valid_from && Date.parse(coupon.valid_from) > stamp) {
    throw invalid('Mã giảm giá chưa tới thời gian áp dụng.');
  }
  if (coupon.valid_to && Date.parse(coupon.valid_to) < stamp) {
    throw invalid('Mã giảm giá đã hết hạn sử dụng.');
  }
  if (coupon.usage_limit != null && toNumber(coupon.used_count) >= toNumber(coupon.usage_limit)) {
    throw invalid('Mã giảm giá đã hết lượt sử dụng.');
  }
  if (userId && coupon.usage_limit_per_user != null) {
    const used = await repo.countCouponUsagesByUser(coupon.id, userId);
    if (used >= toNumber(coupon.usage_limit_per_user)) {
      throw invalid('Bạn đã dùng mã giảm giá này đủ số lượt cho phép.');
    }
  }

  const amount = Math.max(0, toNumber(orderAmount));
  const minOrder = toNumber(coupon.min_order_amount);
  if (amount < minOrder) {
    throw invalid(`Đơn hàng cần tối thiểu ${formatVND(minOrder)} để dùng mã này.`);
  }

  if (coupon.discount_type === 'FREESHIP') {
    return {
      coupon,
      discountAmount: 0,
      freeship: true,
      message: 'Mã miễn phí vận chuyển hợp lệ, áp dụng khi chọn phương thức giao hàng.',
    };
  }

  const base = await resolveEligibleBase(coupon, items, amount);
  if (base <= 0) {
    throw invalid('Mã giảm giá không áp dụng cho sản phẩm trong đơn hàng.');
  }

  const discountAmount = computeDiscount(coupon, base);
  if (discountAmount <= 0) throw invalid('Mã giảm giá không tạo ra khoản giảm nào cho đơn hàng này.');

  return {
    coupon,
    discountAmount,
    freeship: false,
    message: `Đã áp dụng mã ${coupon.code}, giảm ${formatVND(discountAmount)}.`,
  };
}

/**
 * M09-F08 — CouponService.verifyCoupon: hợp đồng M04/M05/M07 (ném lỗi khi không hợp lệ).
 * @param {{ code: string, order_amount: number, user_id?: string, customer_id?: string, guest_session_id?: string, items?: unknown[] }} input
 */
export async function verifyCoupon(input = {}) {
  const result = await evaluateCoupon({
    code: input.code,
    orderAmount: input.order_amount ?? input.orderAmount ?? 0,
    userId: input.user_id ?? input.customer_id ?? null,
    items: input.items ?? [],
  });

  return {
    is_valid: true,
    discount_amount: result.discountAmount,
    freeship: result.freeship,
    message: result.message,
    coupon: mapCoupon(result.coupon),
  };
}

/** API-M09-03 — cùng logic nhưng trả `is_valid=false` cho lỗi nghiệp vụ (thay vì 4xx). */
export async function verifyCouponForHttp({ body, auth }) {
  try {
    return await verifyCoupon({
      code: body.code,
      order_amount: body.order_amount,
      user_id: auth?.userId ?? body.customer_id ?? null,
      items: body.items ?? [],
    });
  } catch (error) {
    const businessCodes = [
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.NOT_FOUND,
      ERROR_CODES.CONFLICT,
    ];
    if (error instanceof AppError && businessCodes.includes(error.code)) {
      return { is_valid: false, discount_amount: 0, message: error.message };
    }
    throw error;
  }
}

/** Migration 003 chưa chạy: báo lỗi cấu hình thay vì 500 khó hiểu. */
function isMissingRoutine(error) {
  const code = error?.cause?.code ?? error?.code;
  const message = String(error?.cause?.message ?? error?.message ?? '');
  return code === 'PGRST202' || /could not find the function/i.test(message);
}

async function callCouponRpc(fn) {
  try {
    return await fn();
  } catch (error) {
    if (isMissingRoutine(error)) {
      throw unavailable(
        'Chức năng coupon chưa sẵn sàng. Hãy chạy database/migrations/003_m09_marketing_coupon_service.sql.',
        { reason: 'MIGRATION_003_REQUIRED' },
      );
    }
    throw error;
  }
}

/** M09-F08 / BR-M07-05 — ghi nhận lượt dùng nguyên tử khi tạo đơn. */
export async function consumeCoupon(input = {}) {
  const orderId = input.order_id ?? input.orderId ?? null;
  if (!orderId) throw invalid('Thiếu mã đơn hàng để ghi nhận lượt dùng coupon.');

  const coupon = input.coupon_id
    ? await repo.findCouponById(input.coupon_id)
    : await repo.findCouponByCode(String(input.coupon_code ?? input.code ?? '').toUpperCase());
  if (!coupon) throw notFound('Không tìm thấy mã giảm giá.');

  const result = await callCouponRpc(() =>
    repo.consumeCouponRpc({
      couponId: coupon.id,
      orderId,
      userId: input.user_id ?? input.userId ?? null,
      discountAmount: input.discount_amount ?? input.discountAmount ?? 0,
    }),
  );

  return {
    coupon_id: coupon.id,
    code: coupon.code,
    order_id: orderId,
    used_count: toNumber(result?.used_count),
    already_used: Boolean(result?.already_used),
  };
}

/** M09-F08 / BR-M09-05 — hoàn lượt dùng khi hủy đơn hợp lệ. */
export async function releaseCoupon(input = {}) {
  const orderId = input.order_id ?? input.orderId ?? null;
  if (!orderId) throw invalid('Thiếu mã đơn hàng để hoàn lượt dùng coupon.');

  const coupon = input.coupon_id
    ? await repo.findCouponById(input.coupon_id)
    : await repo.findCouponByCode(String(input.coupon_code ?? input.code ?? '').toUpperCase());
  if (!coupon) throw notFound('Không tìm thấy mã giảm giá.');

  const result = await callCouponRpc(() =>
    repo.releaseCouponRpc({ couponId: coupon.id, orderId }),
  );

  return {
    coupon_id: coupon.id,
    code: coupon.code,
    order_id: orderId,
    released: Boolean(result?.released),
    used_count: toNumber(result?.used_count),
  };
}

/* ------------------------------------------------------------------ */
/* M09-F05 — Cron trạng thái nội dung                                  */
/* ------------------------------------------------------------------ */

/**
 * Cron campaigns (vercel.json: 0 0 * * *): bật/tắt banner, xuất bản bài hẹn giờ,
 * kích hoạt/kết thúc chiến dịch theo lịch. Mỗi bước độc lập để một lỗi không
 * chặn các bước còn lại.
 */
export async function activateScheduledContent(now = new Date()) {
  const stamp = now.toISOString();
  const result = {
    ran_at: stamp,
    banners_published: 0,
    banners_archived: 0,
    articles_published: 0,
    campaigns_activated: 0,
    campaigns_ended: 0,
    errors: [],
  };

  const step = async (key, task) => {
    try {
      result[key] = await task();
    } catch (error) {
      result.errors.push({ step: key, message: error?.message ?? String(error) });
    }
  };

  await step('banners_published', async () => (await repo.publishScheduledBanners(stamp)).length);
  await step('banners_archived', async () => (await repo.archiveExpiredBanners(stamp)).length);
  await step('articles_published', async () => (await repo.publishScheduledArticles(stamp)).length);
  await step('campaigns_activated', async () => {
    const rows = await repo.listCampaignsAwaitingActivation(stamp);
    return repo.bulkUpdateCampaignStatus(
      rows.map((row) => row.id),
      CAMPAIGN_STATUS.ACTIVE,
    );
  });
  await step('campaigns_ended', async () => {
    const rows = await repo.listCampaignsAwaitingEnd(stamp);
    return repo.bulkUpdateCampaignStatus(rows.map((row) => row.id), CAMPAIGN_STATUS.ENDED);
  });

  return result;
}
