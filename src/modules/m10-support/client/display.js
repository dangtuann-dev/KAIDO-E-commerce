/**
 * [TOY-M10] Hằng số hiển thị dùng chung cho các trang M10 (client-side).
 * Nhãn tiếng Việt, màu badge và định dạng ngày giờ theo múi giờ Việt Nam (Blueprint §0).
 */
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import {
  REVIEW_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/shared/constants/support.js';

export { REVIEW_STATUS_LABELS, TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS };

/** Nhãn người gửi trong hội thoại ticket. */
export const TICKET_SENDER_LABELS = Object.freeze({
  CUSTOMER: 'Khách hàng',
  STAFF: 'KAIDO',
  SYSTEM: 'Hệ thống',
});

/** Nhãn hành động kiểm duyệt đánh giá (M10-F04). */
export const MODERATION_ACTION_LABELS = Object.freeze({
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  HIDE: 'Ẩn',
});

/** Tông badge theo trạng thái đánh giá. */
export const REVIEW_STATUS_TONES = Object.freeze({
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  HIDDEN: 'neutral',
});

/** Tông badge theo trạng thái ticket. */
export const TICKET_STATUS_TONES = Object.freeze({
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
});

/** Tông badge theo mức ưu tiên. */
export const TICKET_PRIORITY_TONES = Object.freeze({
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
});

/** BR-M10-05 — giới hạn tệp đính kèm (chỉ nhận URL). */
export const MEDIA_LIMITS = Object.freeze({
  maxFiles: BUSINESS_RULES.SUPPORT.MAX_REVIEW_MEDIA_FILES,
  maxVideoFiles: BUSINESS_RULES.SUPPORT.MAX_REVIEW_VIDEO_FILES,
  maxFileSizeMb: BUSINESS_RULES.SUPPORT.MAX_ATTACHMENT_SIZE_MB,
  minTextLength: BUSINESS_RULES.SUPPORT.REVIEW_TEXT_MIN_LENGTH,
  maxTextLength: BUSINESS_RULES.SUPPORT.REVIEW_TEXT_MAX_LENGTH,
  editWindowDays: BUSINESS_RULES.SUPPORT.REVIEW_EDIT_WINDOW_DAYS,
});

/** Nhãn công khai của phản hồi cửa hàng (M10-F05). */
export const STORE_REPLY_LABEL = 'KAIDO Store';

export const TICKET_SLA_HOURS = BUSINESS_RULES.SUPPORT.TICKET_SLA_RESPONSE_HOURS;
export const TICKET_AUTO_CLOSE_HOURS = BUSINESS_RULES.SUPPORT.TICKET_AUTO_CLOSE_HOURS;
export const REVIEW_PAGE_SIZE = BUSINESS_RULES.SUPPORT.REVIEW_PAGE_SIZE;

/** Hành động CSKH hợp lệ theo trạng thái — khớp TICKET_TRANSITIONS ở server. */
const TICKET_ACTIONS = Object.freeze({
  OPEN: [
    { action: 'ASSIGN', label: 'Phân công', variant: 'outline' },
    { action: 'REPLY', label: 'Phản hồi', variant: 'primary' },
    { action: 'CLOSE', label: 'Đóng', variant: 'ghost' },
  ],
  IN_PROGRESS: [
    { action: 'REPLY', label: 'Phản hồi', variant: 'primary' },
    { action: 'RESOLVE', label: 'Đã giải quyết', variant: 'secondary' },
    { action: 'CLOSE', label: 'Đóng', variant: 'ghost' },
  ],
  RESOLVED: [
    { action: 'REOPEN', label: 'Mở lại', variant: 'outline' },
    { action: 'CLOSE', label: 'Đóng', variant: 'ghost' },
  ],
  CLOSED: [],
});

export function ticketActions(status) {
  return TICKET_ACTIONS[status] ?? [];
}

/** Số sao → nhãn ngắn dùng trong bảng và ARIA. */
export function starsLabel(rating) {
  if (rating == null || rating === '') return '—';
  const value = Number(rating);
  return Number.isFinite(value) ? `${value} sao` : '—';
}

/** Phân bố sao → mảng 5..1 kèm phần trăm để vẽ thanh (M10-F03). */
export function buildRatingBars(breakdown, total) {
  const count = Number(total) || 0;
  return [5, 4, 3, 2, 1].map((stars) => {
    const value = Number(breakdown?.[stars] ?? breakdown?.[String(stars)] ?? 0);
    const percent = count > 0 ? Math.round((value / count) * 100) : 0;
    return { stars, count: value, percent };
  });
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function parse(value) {
  const stamp = Date.parse(value ?? '');
  return Number.isFinite(stamp) ? stamp : null;
}

export function formatDate(value) {
  const stamp = parse(value);
  return stamp == null ? '—' : DATE_FORMATTER.format(new Date(stamp));
}

export function formatDateTime(value) {
  const stamp = parse(value);
  return stamp == null ? '—' : DATE_TIME_FORMATTER.format(new Date(stamp));
}
