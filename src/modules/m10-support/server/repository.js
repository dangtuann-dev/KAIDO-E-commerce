import 'server-only';
import { getSupabaseAdmin } from '@/server/db/supabase.js';
import { fromSupabaseError } from '@/server/http/errors.js';

/** Bảng M10 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'reviews',
  'review_media',
  'review_replies',
  'faq_categories',
  'faqs',
  'support_tickets',
  'ticket_messages',
  'ticket_attachments',
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

async function count(builder) {
  const { count: total, error } = await builder;
  if (error) throw fromSupabaseError(error);
  return total ?? 0;
}

async function callRpc(name, args) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (error) throw fromSupabaseError(error);
  return data;
}

/**
 * Bảng `review_replies` thuộc migration 006: khi chưa chạy migration,
 * PostgREST trả PGRST205 (schema cache). Đọc danh sách vẫn phải chạy được.
 */
function isMissingTable(error) {
  if (!error) return false;
  const code = String(error.code ?? '');
  if (code === '42P01' || code === 'PGRST205') return true;
  return /schema cache|does not exist/i.test(String(error.message ?? ''));
}

async function runTolerant(builder, fallback) {
  const { data, error } = await builder;
  if (error) {
    if (isMissingTable(error)) return fallback;
    throw fromSupabaseError(error);
  }
  return data;
}

/** PostgREST `or` cần escape ký tự phân tách của bộ lọc. */
function safeKeyword(keyword) {
  return String(keyword ?? '')
    .replace(/[,()%*\\]/g, ' ')
    .trim();
}

const REVIEW_COLUMNS =
  'id,product_id,variant_id,user_id,order_item_id,rating,title,content,status,is_verified,helpful_count,admin_note,moderated_by,moderated_at,created_at,updated_at';

const REPLY_COLUMNS = 'id,review_id,replier_id,content,created_at,updated_at';

const TICKET_COLUMNS =
  'id,ticket_code,user_id,order_id,subject,category,priority,status,assigned_to,resolved_at,closed_at,created_at,updated_at';

const MESSAGE_COLUMNS = 'id,ticket_id,sender_type,sender_id,content,created_at';

const FAQ_COLUMNS =
  'id,category_id,question,answer,sort_order,is_active,view_count,created_at,updated_at,deleted_at';

const FAQ_CATEGORY_COLUMNS = 'id,name,slug,sort_order,is_active,created_at,updated_at';

/* ------------------------------------------------------------------ */
/* Đánh giá (M10-F01..F05)                                            */
/* ------------------------------------------------------------------ */

/** Đánh giá đã duyệt của một sản phẩm (M10-F03). */
export async function listApprovedReviews(productId, { stars = null, limit, offset }) {
  let query = table('reviews')
    .select(REVIEW_COLUMNS, { count: 'exact' })
    .eq('product_id', productId)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (stars) query = query.eq('rating', stars);
  return runWithCount(query);
}

/** Đếm số đánh giá đã duyệt theo từng mức sao để dựng breakdown (M10-F03). */
export async function countApprovedByRating(productId) {
  const stars = [1, 2, 3, 4, 5];
  const counts = await Promise.all(
    stars.map((star) =>
      count(
        table('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('status', 'APPROVED')
          .eq('rating', star),
      ),
    ),
  );

  const breakdown = {};
  stars.forEach((star, index) => {
    breakdown[star] = counts[index];
  });
  return breakdown;
}

export async function listReviewsByUser(userId, { limit, offset }) {
  return runWithCount(
    table('reviews')
      .select(REVIEW_COLUMNS, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
  );
}

export async function listAdminReviews({
  status = null,
  rating = null,
  productId = null,
  keyword = null,
  limit,
  offset,
}) {
  let query = table('reviews')
    .select(REVIEW_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (rating) query = query.eq('rating', rating);
  if (productId) query = query.eq('product_id', productId);

  const search = safeKeyword(keyword);
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  return runWithCount(query);
}

export async function findReviewById(id) {
  return run(table('reviews').select(REVIEW_COLUMNS).eq('id', id).maybeSingle());
}

export async function findReviewByUserAndOrderItem(userId, orderItemId) {
  return run(
    table('reviews')
      .select(REVIEW_COLUMNS)
      .eq('user_id', userId)
      .eq('order_item_id', orderItemId)
      .maybeSingle(),
  );
}

export async function insertReview(data) {
  return run(table('reviews').insert(data).select(REVIEW_COLUMNS).single());
}

export async function updateReviewRow(id, patch) {
  return run(
    table('reviews')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(REVIEW_COLUMNS)
      .maybeSingle(),
  );
}

export async function deleteReviewRow(id) {
  return run(table('reviews').delete().eq('id', id).select('id,product_id').maybeSingle());
}

/** Ghi hoặc thay phản hồi của cửa hàng (M10-F05, 1 phản hồi/review). */
export async function upsertReviewReply({ reviewId, replierId, content }) {
  return run(
    table('review_replies')
      .upsert(
        {
          review_id: reviewId,
          replier_id: replierId ?? null,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'review_id' },
      )
      .select(REPLY_COLUMNS)
      .single(),
  );
}

export async function listReviewReplies(reviewIds) {
  if (!reviewIds.length) return [];
  const rows = await runTolerant(
    table('review_replies').select(REPLY_COLUMNS).in('review_id', reviewIds),
    [],
  );
  return rows ?? [];
}

/* ------------------------------------------------------------------ */
/* Media đánh giá (M10-F01, BR-M10-05)                                */
/* ------------------------------------------------------------------ */

export async function createReviewMedia(reviewId, mediaRows) {
  if (!mediaRows.length) return [];
  return run(
    table('review_media')
      .insert(mediaRows.map((row) => ({ ...row, review_id: reviewId })))
      .select('id,review_id,media_type,url,file_size_bytes,sort_order'),
  );
}

export async function listReviewMedia(reviewIds) {
  if (!reviewIds.length) return [];
  return run(
    table('review_media')
      .select('id,review_id,media_type,url,file_size_bytes,sort_order')
      .in('review_id', reviewIds)
      .order('sort_order', { ascending: true }),
  );
}

export async function deleteReviewMedia(reviewId) {
  return run(table('review_media').delete().eq('review_id', reviewId).select('id'));
}

/* ------------------------------------------------------------------ */
/* Câu hỏi thường gặp (M10-F09, F10)                                  */
/* ------------------------------------------------------------------ */

export async function listFaqCategories({ includeInactive = false } = {}) {
  let query = table('faq_categories')
    .select(FAQ_CATEGORY_COLUMNS)
    .order('sort_order', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  return run(query);
}

export async function findFaqCategoryById(id) {
  return run(table('faq_categories').select(FAQ_CATEGORY_COLUMNS).eq('id', id).maybeSingle());
}

export async function findFaqCategoryBySlug(slug) {
  return run(
    table('faq_categories').select(FAQ_CATEGORY_COLUMNS).eq('slug', slug).maybeSingle(),
  );
}

export async function insertFaqCategory(data) {
  return run(table('faq_categories').insert(data).select(FAQ_CATEGORY_COLUMNS).single());
}

export async function countFaqsByCategory(categoryId) {
  return count(
    table('faqs')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null),
  );
}

export async function listFaqs({ keyword, categoryId, includeInactive = false } = {}) {
  let query = table('faqs')
    .select(FAQ_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (!includeInactive) query = query.eq('is_active', true);

  const search = safeKeyword(keyword);
  if (search) query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
  return run(query);
}

export async function findFaqById(id) {
  return run(table('faqs').select(FAQ_COLUMNS).eq('id', id).is('deleted_at', null).maybeSingle());
}

export async function insertFaqRow(data) {
  return run(table('faqs').insert(data).select(FAQ_COLUMNS).single());
}

export async function updateFaqRow(id, patch) {
  return run(
    table('faqs')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(FAQ_COLUMNS)
      .maybeSingle(),
  );
}

export async function softDeleteFaqRow(id) {
  return run(
    table('faqs')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('id,deleted_at')
      .maybeSingle(),
  );
}

/** Đếm đánh giá theo trạng thái cho dashboard CSKH (M10-F11). */
export async function countReviewsByStatus(status) {
  return count(
    table('reviews').select('id', { count: 'exact', head: true }).eq('status', status),
  );
}

/** Đếm FAQ đang hiển thị (M10-F11). */
export async function countActiveFaqs() {
  return count(
    table('faqs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null),
  );
}

/* ------------------------------------------------------------------ */
/* Ticket hỗ trợ (M10-F06..F08)                                       */
/* ------------------------------------------------------------------ */

export async function insertSupportTicket(data) {
  return run(table('support_tickets').insert(data).select(TICKET_COLUMNS).single());
}

/** ticketRef chấp nhận `#TK-00001`, `TK-00001` hoặc uuid. */
export async function findSupportTicketByRef(ticketRef) {
  const ref = String(ticketRef ?? '').trim();
  if (!ref) return null;

  const normalized = ref.startsWith('#') ? ref : `#${ref}`;
  const columns = TICKET_COLUMNS;
  const byCode = await run(
    table('support_tickets').select(columns).eq('ticket_code', normalized).maybeSingle(),
  );
  if (byCode) return byCode;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  if (!isUuid) return null;

  return run(table('support_tickets').select(columns).eq('id', ref).maybeSingle());
}

export async function findSupportTicketById(id) {
  return run(table('support_tickets').select(TICKET_COLUMNS).eq('id', id).maybeSingle());
}

export async function listSupportTicketsByUser(userId, { status = null, limit, offset }) {
  let query = table('support_tickets')
    .select(TICKET_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  return runWithCount(query);
}

export async function listAdminSupportTickets({
  status = null,
  category = null,
  priority = null,
  assignedTo = null,
  keyword = null,
  limit,
  offset,
}) {
  let query = table('support_tickets')
    .select(TICKET_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (priority) query = query.eq('priority', priority);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);

  const search = safeKeyword(keyword);
  if (search) query = query.or(`subject.ilike.%${search}%,ticket_code.ilike.%${search}%`);
  return runWithCount(query);
}

export async function deleteSupportTicketRow(id) {
  return run(table('support_tickets').delete().eq('id', id).select('id').maybeSingle());
}

export async function updateSupportTicketRow(id, patch) {
  return run(
    table('support_tickets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(TICKET_COLUMNS)
      .maybeSingle(),
  );
}

export async function insertTicketMessage(data) {
  return run(table('ticket_messages').insert(data).select(MESSAGE_COLUMNS).single());
}

export async function listTicketMessages(ticketId) {
  return run(
    table('ticket_messages')
      .select(MESSAGE_COLUMNS)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  );
}

export async function createTicketAttachments(messageId, rows) {
  if (!rows.length) return [];
  return run(
    table('ticket_attachments')
      .insert(rows.map((row) => ({ ...row, message_id: messageId })))
      .select('id,message_id,media_type,file_url,file_size_bytes'),
  );
}

export async function listTicketAttachments(messageIds) {
  if (!messageIds.length) return [];
  return run(
    table('ticket_attachments')
      .select('id,message_id,media_type,file_url,file_size_bytes')
      .in('message_id', messageIds),
  );
}

export async function findLatestCustomerMessage(ticketId) {
  return run(
    table('ticket_messages')
      .select(MESSAGE_COLUMNS)
      .eq('ticket_id', ticketId)
      .eq('sender_type', 'CUSTOMER')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function countTicketsByStatus(status) {
  return count(
    table('support_tickets').select('id', { count: 'exact', head: true }).eq('status', status),
  );
}

/** Ticket còn mở nhưng đã quá hạn phản hồi đầu tiên (SLA). */
export async function countOverdueTickets(createdBeforeIso) {
  return count(
    table('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['OPEN', 'IN_PROGRESS'])
      .lt('created_at', createdBeforeIso),
  );
}

export async function listResolvedTicketsOlderThan(cutoffIso, limit = 200) {
  return run(
    table('support_tickets')
      .select(TICKET_COLUMNS)
      .eq('status', 'RESOLVED')
      .not('resolved_at', 'is', null)
      .lte('resolved_at', cutoffIso)
      .order('resolved_at', { ascending: true })
      .limit(limit),
  );
}

/** BR-M10-04 — ưu tiên hàm PL/pgSQL khi migration 006 đã chạy. */
export async function closeResolvedTicketsRpc(hours) {
  return callRpc('m10_close_resolved_tickets', { p_hours: hours });
}
