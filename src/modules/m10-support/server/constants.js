import 'server-only';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import {
  REVIEW_STATUS,
  TICKET_CATEGORY_VALUES,
  TICKET_PRIORITY_VALUES,
  TICKET_SENDER_TYPES,
  TICKET_STATUS,
} from '@/shared/constants/support.js';

export const MODULE_CODE = 'TOY-M10';

export const REVIEW_LIMITS = Object.freeze({
  maxMediaFiles: BUSINESS_RULES.SUPPORT.MAX_REVIEW_MEDIA_FILES,
  maxImageFiles: BUSINESS_RULES.SUPPORT.MAX_REVIEW_MEDIA_FILES,
  maxVideoFiles: BUSINESS_RULES.SUPPORT.MAX_REVIEW_VIDEO_FILES,
  maxFileSizeMb: BUSINESS_RULES.SUPPORT.MAX_ATTACHMENT_SIZE_MB,
  minTextLength: BUSINESS_RULES.SUPPORT.REVIEW_TEXT_MIN_LENGTH,
  maxTextLength: BUSINESS_RULES.SUPPORT.REVIEW_TEXT_MAX_LENGTH,
  editWindowDays: BUSINESS_RULES.SUPPORT.REVIEW_EDIT_WINDOW_DAYS,
  pageSize: BUSINESS_RULES.SUPPORT.REVIEW_PAGE_SIZE,
});

export const REVIEW_STATUSES = Object.freeze(REVIEW_STATUS);
export const TICKET_STATUSES = Object.freeze(TICKET_STATUS);
export const TICKET_CATEGORIES = Object.freeze(TICKET_CATEGORY_VALUES);
export const TICKET_PRIORITIES = Object.freeze(TICKET_PRIORITY_VALUES);
export const TICKET_SENDERS = Object.freeze(TICKET_SENDER_TYPES);

export const TICKET_AUTO_CLOSE_HOURS = BUSINESS_RULES.SUPPORT.TICKET_AUTO_CLOSE_HOURS;
export const TICKET_SLA_RESPONSE_HOURS = BUSINESS_RULES.SUPPORT.TICKET_SLA_RESPONSE_HOURS;

/** Hành động kiểm duyệt → trạng thái đích (M10-F04, BR-M10-03). */
export const MODERATION_TARGET_STATUS = Object.freeze({
  APPROVE: REVIEW_STATUS.APPROVED,
  REJECT: REVIEW_STATUS.REJECTED,
  HIDE: REVIEW_STATUS.HIDDEN,
});

/** Chuyển trạng thái ticket hợp lệ (M10-F08). */
export const TICKET_TRANSITIONS = Object.freeze({
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['OPEN', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
});

/** Khách được bổ sung tin nhắn khi ticket còn trong các trạng thái này (M10-F07). */
export const CUSTOMER_REPLYABLE_STATUSES = Object.freeze(['OPEN', 'IN_PROGRESS', 'RESOLVED']);

/** Số ngày khách được sửa/xóa đánh giá của mình (M10-F02). */
export const REVIEW_EDIT_WINDOW_MS = REVIEW_LIMITS.editWindowDays * 24 * 60 * 60 * 1000;

/** Danh sách back-office mặc định 20 dòng/trang. */
export const DEFAULT_LIST_LIMIT = 20;

/** Tên hiển thị của cửa hàng khi phản hồi công khai (M10-F05). */
export const STORE_REPLY_LABEL = 'KAIDO Store';

const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/** Suy ra loại media từ URL (chỉ nhận URL, không upload — quy ước dự án). */
export function inferMediaType(url) {
  return VIDEO_URL_PATTERN.test(String(url ?? '')) ? 'VIDEO' : 'IMAGE';
}
