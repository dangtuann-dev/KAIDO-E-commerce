import 'server-only';
import { buildPaginationMeta } from '@/server/http/pagination.js';
import { AppError } from '@/server/http/errors.js';
import { ERROR_CODES } from '@/shared/constants/error-codes.js';
import { getCustomerDisplayName } from '@/modules/m01-account/public.server.js';
import {
  getProductReference,
  listProductSnapshots,
  updateProductRatingSummary,
} from '@/modules/m02-catalog/public.server.js';
import { findVerifiedOrderItem } from '@/modules/m05-checkout/public.server.js';
import {
  DEFAULT_LIST_LIMIT,
  MODERATION_TARGET_STATUS,
  REVIEW_EDIT_WINDOW_MS,
  REVIEW_LIMITS,
  REVIEW_STATUSES,
  STORE_REPLY_LABEL,
} from './constants.js';
import {
  charLength,
  conflict,
  forbidden,
  invalid,
  isStaffRole,
  normalizeMedia,
  notFound,
  toNumber,
} from './helpers.js';
import * as repo from './repository.js';
import { slugify } from '@/shared/utils/slugify.js';

/**
 * [SERVER] M10 — nghiệp vụ đánh giá sản phẩm và FAQ.
 * SRS: TOY-M10 (M10-F01..F05, F09, F10). Repository chỉ ánh xạ dữ liệu.
 */

/* ------------------------------------------------------------------ */
/* DTO                                                                 */
/* ------------------------------------------------------------------ */

function mapMedia(rows = []) {
  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    media_type: row.media_type,
  }));
}

function mapReply(row) {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    replier_name: STORE_REPLY_LABEL,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

function mapReview(row, { media = [], reply = null, displayName = null, includeModeration = false } = {}) {
  if (!row) return null;
  const dto = {
    review_id: row.id,
    product_id: row.product_id,
    variant_id: row.variant_id ?? null,
    user_id: row.user_id,
    customer_name: displayName ?? 'Khách hàng KAIDO',
    rating: toNumber(row.rating),
    title: row.title ?? null,
    comment: row.content,
    status: row.status,
    is_verified: row.is_verified !== false,
    helpful_count: toNumber(row.helpful_count),
    images: mapMedia(media),
    reply: mapReply(reply),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (includeModeration) {
    dto.admin_note = row.admin_note ?? null;
    dto.moderated_by = row.moderated_by ?? null;
    dto.moderated_at = row.moderated_at ?? null;
  }
  return dto;
}

function summarizeBreakdown(breakdown) {
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const weighted = Object.entries(breakdown).reduce(
    (sum, [star, value]) => sum + Number(star) * value,
    0,
  );
  const average = total > 0 ? weighted / total : 0;
  return {
    rating_avg: Math.round(average * 10) / 10,
    rating_count: total,
  };
}

/* ------------------------------------------------------------------ */
/* Tiện ích nội bộ                                                     */
/* ------------------------------------------------------------------ */

async function resolveProduct(idOrSlug) {
  const product = await getProductReference(idOrSlug);
  if (!product) throw notFound('Không tìm thấy sản phẩm.');
  return product;
}

async function resolveDisplayNames(userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (userId) => [userId, await getCustomerDisplayName(userId)]),
  );
  return new Map(entries);
}

async function attachReviewRelations(rows) {
  const ids = rows.map((row) => row.id);
  const [mediaRows, replyRows] = await Promise.all([
    repo.listReviewMedia(ids),
    repo.listReviewReplies(ids),
  ]);
  const names = await resolveDisplayNames(rows.map((row) => row.user_id));

  const mediaByReview = new Map();
  for (const row of mediaRows) {
    if (!mediaByReview.has(row.review_id)) mediaByReview.set(row.review_id, []);
    mediaByReview.get(row.review_id).push(row);
  }

  const replyByReview = new Map(replyRows.map((row) => [row.review_id, row]));

  return rows.map((row) =>
    mapReview(row, {
      media: mediaByReview.get(row.id) ?? [],
      reply: replyByReview.get(row.id) ?? null,
      displayName: names.get(row.user_id) ?? null,
    }),
  );
}

/** BR-M10-03 — tổng hợp rating đã duyệt và đồng bộ sang M02. */
async function syncProductRating(productId) {
  const breakdown = await repo.countApprovedByRating(productId);
  const summary = summarizeBreakdown(breakdown);

  try {
    await updateProductRatingSummary(productId, {
      rating_avg: summary.rating_avg,
      rating_count: summary.rating_count,
    });
  } catch (error) {
    // Sản phẩm đã bị xóa cứng: bỏ qua đồng bộ, đánh giá vẫn được lưu.
    if (error?.code !== 'NOT_FOUND') throw error;
  }

  return { ...summary, rating_breakdown: breakdown };
}

function assertWithinEditWindow(review, { isOwner }) {
  if (!isOwner) throw forbidden('Chỉ chủ đánh giá được thay đổi nội dung này.');

  const created = Date.parse(review.created_at ?? '');
  if (!Number.isFinite(created)) return;
  if (Date.now() - created > REVIEW_EDIT_WINDOW_MS) {
    throw conflict(
      `Đã quá ${REVIEW_LIMITS.editWindowDays} ngày kể từ khi gửi đánh giá nên không thể thay đổi (M10-F02).`,
    );
  }
}

function assertContentLength(comment) {
  const length = charLength(comment);
  if (length < REVIEW_LIMITS.minTextLength || length > REVIEW_LIMITS.maxTextLength) {
    throw invalid(
      `Nội dung đánh giá phải từ ${REVIEW_LIMITS.minTextLength} đến ${REVIEW_LIMITS.maxTextLength} ký tự.`,
    );
  }
}

function toMediaRows(urls = []) {
  return normalizeMedia(urls).map(({ media_type, url, file_size_bytes, sort_order }) => ({
    media_type,
    url,
    file_size_bytes,
    sort_order,
  }));
}

/* ------------------------------------------------------------------ */
/* M10-F01 — Gửi đánh giá (Verified Purchase)                          */
/* ------------------------------------------------------------------ */

export async function createReview({ auth, idOrSlug, body }) {
  const userId = auth?.userId;
  if (!userId) throw forbidden('Vui lòng đăng nhập để gửi đánh giá.');

  const product = await resolveProduct(idOrSlug);
  if (product.status !== 'ACTIVE') {
    throw invalid('Sản phẩm đã ngừng kinh doanh nên không nhận đánh giá mới.');
  }

  const purchase = await findVerifiedOrderItem({
    orderRef: body.order_id,
    userId,
    productId: product.product_id,
  });
  if (!purchase) {
    throw forbidden(
      'Chỉ khách đã mua sản phẩm trong đơn đã hoàn thành mới được đánh giá (BR-M10-01).',
    );
  }

  assertContentLength(body.comment);

  const existing = await repo.findReviewByUserAndOrderItem(userId, purchase.order_item_id);
  if (existing) {
    throw conflict('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.');
  }

  const mediaRows = toMediaRows(body.images ?? []);

  const review = await repo.insertReview({
    product_id: product.product_id,
    variant_id: purchase.variant_id ?? null,
    user_id: userId,
    order_item_id: purchase.order_item_id,
    rating: body.rating,
    title: body.title?.trim() || null,
    content: body.comment.trim(),
    status: REVIEW_STATUSES.PENDING,
    is_verified: true,
  });

  if (mediaRows.length > 0) {
    try {
      await repo.createReviewMedia(review.id, mediaRows);
    } catch (error) {
      await repo.deleteReviewRow(review.id).catch(() => null);
      throw error;
    }
  }

  return {
    review_id: review.id,
    product_id: review.product_id,
    order_id: purchase.order_id,
    status: review.status,
    is_verified: review.is_verified,
    created_at: review.created_at,
    message: 'Đánh giá đã được gửi và đang chờ kiểm duyệt (M10-F04).',
  };
}

/* ------------------------------------------------------------------ */
/* M10-F02 — Sửa / Xóa đánh giá của chính mình                         */
/* ------------------------------------------------------------------ */

export async function updateReview({ auth, id, body }) {
  const review = await repo.findReviewById(id);
  if (!review) throw notFound('Không tìm thấy đánh giá.');

  const isOwner = review.user_id === auth?.userId;
  assertWithinEditWindow(review, { isOwner });

  const patch = {};
  if (body.rating != null) patch.rating = body.rating;
  if (body.title !== undefined) patch.title = body.title?.trim() || null;
  if (body.comment !== undefined) {
    assertContentLength(body.comment);
    patch.comment = body.comment.trim();
  }

  let nextMedia = null;
  if (body.images !== undefined) nextMedia = toMediaRows(body.images ?? []);

  const contentChanged = Object.keys(patch).length > 0 || nextMedia !== null;
  if (!contentChanged) throw invalid('Không có thay đổi nào để cập nhật.');

  // Sửa nội dung phải được duyệt lại (BR-M10-03).
  patch.status = REVIEW_STATUSES.PENDING;
  patch.moderated_by = null;
  patch.moderated_at = null;

  const updated = await repo.updateReviewRow(review.id, patch);
  if (!updated) throw notFound('Không tìm thấy đánh giá.');

  if (nextMedia !== null) {
    await repo.deleteReviewMedia(review.id);
    if (nextMedia.length > 0) await repo.createReviewMedia(review.id, nextMedia);
  }

  const rating = await syncProductRating(review.product_id);
  const media = await repo.listReviewMedia([review.id]);

  return {
    review: mapReview(updated, { media, displayName: await getCustomerDisplayName(review.user_id) }),
    ...rating,
    message: 'Đánh giá đã cập nhật và chờ kiểm duyệt lại.',
  };
}

export async function deleteReview({ auth, id }) {
  const review = await repo.findReviewById(id);
  if (!review) throw notFound('Không tìm thấy đánh giá.');

  const isOwner = review.user_id === auth?.userId;
  const staff = isStaffRole(auth?.role);
  if (!isOwner && !staff) throw forbidden();

  if (isOwner && !staff) {
    assertWithinEditWindow(review, { isOwner: true });
  }

  await repo.deleteReviewRow(review.id);
  const rating = await syncProductRating(review.product_id);

  return {
    review_id: review.id,
    product_id: review.product_id,
    deleted: true,
    ...rating,
  };
}

/* ------------------------------------------------------------------ */
/* M10-F03 — Xem đánh giá & điểm sao                                   */
/* ------------------------------------------------------------------ */

export async function listProductReviews({ idOrSlug, query }) {
  const product = await resolveProduct(idOrSlug);
  const { page = 1, limit = REVIEW_LIMITS.pageSize } = query ?? {};
  const offset = (page - 1) * limit;

  const [{ rows, total }, breakdown] = await Promise.all([
    repo.listApprovedReviews(product.product_id, { stars: query?.stars ?? null, limit, offset }),
    repo.countApprovedByRating(product.product_id),
  ]);

  const summary = summarizeBreakdown(breakdown);
  const reviews = await attachReviewRelations(rows);

  return {
    product: { product_id: product.product_id, name: product.name, slug: product.slug },
    rating_avg: summary.rating_avg,
    rating_count: summary.rating_count,
    rating_breakdown: breakdown,
    reviews,
    ...buildPaginationMeta({ page, limit, total }),
  };
}

export async function listMyReviews({ auth, query }) {
  const { page = 1, limit = DEFAULT_LIST_LIMIT } = query ?? {};
  const offset = (page - 1) * limit;

  const { rows, total } = await repo.listReviewsByUser(auth?.userId, { limit, offset });
  const reviews = await attachReviewRelations(rows);
  const snapshots = await listProductSnapshots([...new Set(rows.map((row) => row.product_id))]);
  const products = new Map(snapshots.map((item) => [item.product_id, item]));

  return {
    items: reviews.map((review) => {
      const product = products.get(review.product_id);
      const created = Date.parse(review.created_at ?? '');
      return {
        ...review,
        product_name: product?.name ?? null,
        product_slug: product?.slug ?? null,
        product_thumbnail_url: product?.thumbnail_url ?? null,
        can_edit: Number.isFinite(created) && Date.now() - created <= REVIEW_EDIT_WINDOW_MS,
      };
    }),
    ...buildPaginationMeta({ page, limit, total }),
  };
}

/** M10-F03 — hợp đồng cho M02/storefront (trang chi tiết sản phẩm). */
export async function getProductRatingSummary(productId) {
  const breakdown = await repo.countApprovedByRating(productId);
  const summary = summarizeBreakdown(breakdown);
  return { product_id: productId, ...summary, rating_breakdown: breakdown };
}

/* ------------------------------------------------------------------ */
/* M10-F04 — Kiểm duyệt đánh giá                                       */
/* ------------------------------------------------------------------ */

export async function moderateReview({ auth, id, body }) {
  const review = await repo.findReviewById(id);
  if (!review) throw notFound('Không tìm thấy đánh giá.');

  const targetStatus = MODERATION_TARGET_STATUS[body.action];
  if (!targetStatus) throw invalid('Hành động kiểm duyệt không hợp lệ.');

  const updated = await repo.updateReviewRow(review.id, {
    status: targetStatus,
    admin_note: body.reason?.trim() || null,
    moderated_by: auth?.userId ?? null,
    moderated_at: new Date().toISOString(),
  });
  if (!updated) throw notFound('Không tìm thấy đánh giá.');

  const rating = await syncProductRating(review.product_id);

  return {
    review_id: updated.id,
    status: updated.status,
    admin_note: updated.admin_note ?? null,
    ...rating,
  };
}

export async function listAdminReviews({ query }) {
  const { page = 1, limit = DEFAULT_LIST_LIMIT } = query ?? {};
  const offset = (page - 1) * limit;

  const { rows, total } = await repo.listAdminReviews({
    status: query?.status ?? null,
    rating: query?.rating ?? null,
    productId: query?.product_id ?? null,
    keyword: query?.keyword ?? null,
    limit,
    offset,
  });

  const [reviews, snapshots] = await Promise.all([
    Promise.all(
      rows.map(async (row) => {
        const [media, replies, displayName] = await Promise.all([
          repo.listReviewMedia([row.id]),
          repo.listReviewReplies([row.id]),
          getCustomerDisplayName(row.user_id),
        ]);
        return mapReview(row, {
          media,
          reply: replies[0] ?? null,
          displayName,
          includeModeration: true,
        });
      }),
    ),
    listProductSnapshots([...new Set(rows.map((row) => row.product_id))]),
  ]);

  const products = new Map(snapshots.map((item) => [item.product_id, item]));

  return {
    items: reviews.map((review) => {
      const product = products.get(review.product_id);
      return {
        ...review,
        product_name: product?.name ?? null,
        product_slug: product?.slug ?? null,
        product_thumbnail_url: product?.thumbnail_url ?? null,
      };
    }),
    ...buildPaginationMeta({ page, limit, total }),
  };
}

/* ------------------------------------------------------------------ */
/* M10-F05 — Phản hồi công khai của cửa hàng                           */
/* ------------------------------------------------------------------ */

export async function replyToReview({ auth, id, body }) {
  const review = await repo.findReviewById(id);
  if (!review) throw notFound('Không tìm thấy đánh giá.');

  let reply;
  try {
    reply = await repo.upsertReviewReply({
      reviewId: review.id,
      replierId: auth?.userId ?? null,
      content: body.content.trim(),
    });
  } catch (error) {
    if (error?.code === 'SERVICE_UNAVAILABLE' || error?.status === 503) {
      throw new AppError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Bảng phản hồi đánh giá chưa tồn tại. Hãy chạy database/migrations/006_m10_support.sql.',
      );
    }
    throw error;
  }

  return {
    review_id: review.id,
    reply: mapReply(reply),
  };
}

/* ------------------------------------------------------------------ */
/* M10-F09/F10 — FAQ                                                   */
/* ------------------------------------------------------------------ */

function mapFaq(row, category) {
  return {
    id: row.id,
    category_id: row.category_id,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    question: row.question,
    answer: row.answer,
    sort_order: toNumber(row.sort_order),
    is_active: row.is_active !== false,
    view_count: toNumber(row.view_count),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** M10-F10 — FAQ công khai nhóm theo chủ đề, có tìm kiếm tức thời. */
export async function listFaqs({ query }) {
  const categories = await repo.listFaqCategories();
  const keyword = String(query?.keyword ?? '').trim();
  const categoryRef = String(query?.category ?? '').trim();

  const matchedCategory = categoryRef
    ? categories.find((item) => item.id === categoryRef || item.slug === categoryRef)
    : null;
  if (categoryRef && !matchedCategory) return { groups: [], total: 0 };

  const rows = await repo.listFaqs({
    keyword: keyword || null,
    categoryId: matchedCategory?.id ?? null,
  });

  const byCategory = new Map();
  for (const row of rows) {
    if (!byCategory.has(row.category_id)) byCategory.set(row.category_id, []);
    byCategory.get(row.category_id).push(row);
  }

  const groups = categories
    .filter((category) => byCategory.has(category.id))
    .map((category) => ({
      category: { id: category.id, name: category.name, slug: category.slug },
      questions: byCategory.get(category.id).map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
      })),
    }));

  return { groups, total: rows.length, keyword: keyword || null };
}

export async function listAdminFaqs({ query }) {
  const includeInactive = query?.include_inactive === 'true';
  const [categories, rows] = await Promise.all([
    repo.listFaqCategories({ includeInactive: true }),
    repo.listFaqs({
      keyword: query?.keyword || null,
      categoryId: query?.category_id ?? null,
      includeInactive,
    }),
  ]);

  const byId = new Map(categories.map((category) => [category.id, category]));
  return {
    items: rows.map((row) => mapFaq(row, byId.get(row.category_id))),
    total: rows.length,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort_order: toNumber(category.sort_order),
      is_active: category.is_active !== false,
    })),
  };
}

export async function createFaq({ body }) {
  const category = await repo.findFaqCategoryById(body.category_id);
  if (!category) throw notFound('Không tìm thấy nhóm câu hỏi.');

  const row = await repo.insertFaqRow({
    category_id: category.id,
    question: body.question.trim(),
    answer: body.answer.trim(),
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  });

  return { faq: mapFaq(row, category) };
}

export async function updateFaq({ id, body }) {
  const existing = await repo.findFaqById(id);
  if (!existing) throw notFound('Không tìm thấy câu hỏi.');

  if (body.category_id) {
    const category = await repo.findFaqCategoryById(body.category_id);
    if (!category) throw notFound('Không tìm thấy nhóm câu hỏi.');
  }

  const patch = {};
  if (body.category_id !== undefined) patch.category_id = body.category_id;
  if (body.question !== undefined) patch.question = body.question.trim();
  if (body.answer !== undefined) patch.answer = body.answer.trim();
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  const row = await repo.updateFaqRow(id, patch);
  if (!row) throw notFound('Không tìm thấy câu hỏi.');

  const category = await repo.findFaqCategoryById(row.category_id);
  return { faq: mapFaq(row, category) };
}

export async function deleteFaq({ id }) {
  const existing = await repo.findFaqById(id);
  if (!existing) throw notFound('Không tìm thấy câu hỏi.');

  await repo.softDeleteFaqRow(id);
  return { faq_id: id, deleted: true };
}

export async function listFaqCategories({ query }) {
  const includeInactive = query?.include_inactive === 'true';
  const categories = await repo.listFaqCategories({ includeInactive });
  const counts = await Promise.all(
    categories.map((category) => repo.countFaqsByCategory(category.id)),
  );

  return {
    items: categories.map((category, index) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort_order: toNumber(category.sort_order),
      is_active: category.is_active !== false,
      question_count: toNumber(counts[index]),
    })),
    total: categories.length,
  };
}

export async function createFaqCategory({ body }) {
  const desired = body.slug?.trim() || slugify(body.name);
  if (!desired) throw invalid('Không sinh được slug cho nhóm câu hỏi.');

  const existing = await repo.findFaqCategoryBySlug(desired);
  if (existing) throw conflict('Slug nhóm câu hỏi đã tồn tại.');

  const row = await repo.insertFaqCategory({
    name: body.name.trim(),
    slug: desired,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  });

  return {
    category: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sort_order: toNumber(row.sort_order),
      is_active: row.is_active !== false,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Hợp đồng public.server.js                                           */
/* ------------------------------------------------------------------ */

/** M10-F01 — xác thực quyền đánh giá từ đơn đã COMPLETED. */
export async function assertVerifiedPurchase({ userId, orderRef, productId }) {
  const purchase = await findVerifiedOrderItem({ orderRef, userId, productId });
  return purchase ?? null;
}

/** M10-F03 — điểm sao cho M02/storefront. */
export async function getRatingSummaryForProduct(productId) {
  return getProductRatingSummary(productId);
}

/* Ticket & dashboard (M10-F06..F08, F11) */
export {
  closeResolvedTickets,
  createSupportTicket,
  getAdminSupportTicket,
  getSupportDashboard,
  getSupportTicket,
  listAdminSupportTickets,
  listMySupportTickets,
  processSupportTicket,
  replySupportTicket,
} from './ticket-service.js';
