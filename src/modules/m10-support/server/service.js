import 'server-only';
import { NotImplementedError } from '@/server/http/errors.js';

/**
 * TODO(M10-F01) — Verified Purchase qua order_item COMPLETED; rating 1–5, nội dung 10–1000 ký tự.
 */
export async function createReview() {
  throw new NotImplementedError('M10-F01');
}

/**
 * TODO(M10-F02) — Chỉ chủ review, tối đa 1 lần trong 30 ngày.
 */
export async function updateReview() {
  throw new NotImplementedError('M10-F02');
}

/**
 * TODO(M10-F02) — Chủ review thu hồi trong cửa sổ cho phép.
 */
export async function deleteReview() {
  throw new NotImplementedError('M10-F02');
}

/**
 * TODO(M10-F03) — Review APPROVED, phân trang 10, breakdown 1–5 sao.
 */
export async function listProductReviews() {
  throw new NotImplementedError('M10-F03');
}

/**
 * TODO(M10-F04) — APPROVE/REJECT/HIDE + lý do; đồng bộ rating sang M02.
 */
export async function moderateReview() {
  throw new NotImplementedError('M10-F04');
}

/**
 * TODO(M10-F05) — Phản hồi công khai với nhãn KAIDO Store.
 */
export async function replyToReview() {
  throw new NotImplementedError('M10-F05');
}

/**
 * TODO(M10-F06) — Sinh mã #TK-XXXXX, gửi email xác nhận, đính kèm tối đa 5 tệp.
 */
export async function createSupportTicket() {
  throw new NotImplementedError('M10-F06');
}

/**
 * TODO(M10-F07) — Chỉ chủ ticket xem hội thoại (NFR-M10-02).
 */
export async function getSupportTicket() {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F07) — Khách phản hồi, tự mở lại ticket nếu RESOLVED.
 */
export async function replySupportTicket() {
  throw new NotImplementedError('M10-F07');
}

/**
 * TODO(M10-F08) — Staff nhận xử lý, đặt ưu tiên, phản hồi, đóng ticket; SLA 24h.
 */
export async function processSupportTicket() {
  throw new NotImplementedError('M10-F08');
}

/**
 * TODO(M10-F08) — Cron tự đóng sau 72 giờ không phản hồi (BR-M10-04).
 */
export async function closeResolvedTickets() {
  throw new NotImplementedError('M10-F08');
}

/**
 * TODO(M10-F09) — CRUD/sắp xếp FAQ theo 4 nhóm.
 */
export async function manageFaqs() {
  throw new NotImplementedError('M10-F09');
}

/**
 * TODO(M10-F10) — FAQ accordion + instant search.
 */
export async function listFaqs() {
  throw new NotImplementedError('M10-F10');
}

/**
 * TODO(M10-F11) — Lọc review/ticket, first response time, CSAT.
 */
export async function getSupportDashboard() {
  throw new NotImplementedError('M10-F11');
}
