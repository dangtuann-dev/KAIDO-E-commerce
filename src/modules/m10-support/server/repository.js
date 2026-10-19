import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/** Bảng M10 sở hữu (xem README để biết quy ước dùng chung). */
export const OWNED_TABLES = Object.freeze([
  'reviews',
  'review_media',
  'faq_categories',
  'faqs',
  'support_tickets',
  'ticket_messages',
  'ticket_attachments',
]);

/**
 * TODO: thay stub bằng truy vấn Supabase/PostgREST khi triển khai service.
 * Không đặt business rule trong repository; chỉ ánh xạ dữ liệu.
 */
/**
 * TODO(M10-F03) — bảng `reviews`.
 */
export async function listApprovedReviews(_productId, _filters) {
  throw new NotImplementedError('M10-F03');
}

/**
 * TODO(M10-F04) — bảng `reviews`.
 */
export async function findReviewById(_id) {
  throw new NotImplementedError('M10-F04');
}

/**
 * TODO(M10-F01) — bảng `reviews`.
 */
export async function findReviewByUserAndOrderItem(_userId, _orderItemId) {
  throw new NotImplementedError('M10-F01');
}

/**
 * TODO(M10-F01) — bảng `reviews`.
 */
export async function createReview(_data) {
  throw new NotImplementedError('M10-F01');
}

/**
 * TODO(M10-F02) — bảng `reviews`.
 */
export async function updateReview(_id, _patch) {
  throw new NotImplementedError('M10-F02');
}

/**
 * TODO(M10-F04) — bảng `reviews`.
 */
export async function updateReviewStatus(_id, _status, _patch) {
  throw new NotImplementedError('M10-F04');
}

/**
 * TODO(M10-F01) — bảng `review_media`.
 */
export async function createReviewMedia(_reviewId, _files) {
  throw new NotImplementedError('M10-F01');
}

/**
 * TODO(M10-F10) — bảng `faqs`.
 */
export async function listFaqs(_filters) {
  throw new NotImplementedError('M10-F10');
}

/**
 * TODO(M10-F09) — bảng `faq_categories`.
 */
export async function listFaqCategories() {
  throw new NotImplementedError('M10-F09');
}

/**
 * TODO(M10-F06) — bảng `support_tickets`.
 */
export async function createSupportTicket(_data) {
  throw new NotImplementedError('M10-F06');
}

/**
 * TODO(M10-F07) — bảng `support_tickets`.
 */
export async function findSupportTicketByRef(_ticketRef) {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F07) — bảng `support_tickets`.
 */
export async function listSupportTicketsByUser(_userId, _filters) {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F08) — bảng `support_tickets`.
 */
export async function updateSupportTicket(_id, _patch) {
  throw new NotImplementedError('M10-F08');
}

/**
 * TODO(M10-F07) — bảng `ticket_messages`.
 */
export async function appendTicketMessage(_data) {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F07) — bảng `ticket_messages`.
 */
export async function listTicketMessages(_ticketId) {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F06) — bảng `ticket_attachments`.
 */
export async function createTicketAttachments(_messageId, _files) {
  throw new NotImplementedError('M10-F06');
}
