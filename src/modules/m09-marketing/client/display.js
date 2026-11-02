/**
 * [TOY-M09] Hằng số hiển thị dùng chung cho các trang M09 (client-side).
 * Nhãn tiếng Việt + hàm định dạng ngày giờ theo múi giờ Việt Nam (Blueprint §0).
 */

export const BANNER_POSITION_LABELS = Object.freeze({
  HOME_HERO: 'Hero trang chủ',
  HOME_PROMO: 'Khuyến mãi trang chủ',
  CATEGORY: 'Danh mục',
  SIDEBAR: 'Cột bên',
});

export const CONTENT_STATUS_LABELS = Object.freeze({
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Hẹn lịch',
  PUBLISHED: 'Đang hiển thị',
  ARCHIVED: 'Lưu trữ',
});

export const ARTICLE_STATUS_LABELS = Object.freeze({
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
});

export const CAMPAIGN_STATUS_LABELS = Object.freeze({
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  ACTIVE: 'Đang chạy',
  ENDED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
});

export const CAMPAIGN_TYPE_LABELS = Object.freeze({
  FLASH_SALE: 'Flash sale',
  EVENT: 'Sự kiện',
  SEASONAL: 'Theo mùa',
});

export const COUPON_STATUS_LABELS = Object.freeze({
  ACTIVE: 'Đang áp dụng',
  INACTIVE: 'Tạm ngưng',
  EXPIRED: 'Hết hiệu lực',
  UPCOMING: 'Sắp hiệu lực',
});

export const DISCOUNT_TYPE_LABELS = Object.freeze({
  PERCENT: 'Giảm theo %',
  FIXED: 'Giảm số tiền',
  FREESHIP: 'Miễn phí vận chuyển',
});

export const COUPON_SCOPE_LABELS = Object.freeze({
  ALL: 'Toàn bộ đơn hàng',
  CATEGORY: 'Theo danh mục',
  PRODUCT: 'Theo sản phẩm',
  SHIPPING: 'Phí vận chuyển',
});

/** Màu Badge theo trạng thái (shared/ui/badge.jsx). */
export const STATUS_TONES = Object.freeze({
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  PENDING_APPROVAL: 'info',
  PUBLISHED: 'success',
  ACTIVE: 'success',
  UPCOMING: 'info',
  INACTIVE: 'neutral',
  ARCHIVED: 'neutral',
  ENDED: 'neutral',
  CANCELLED: 'danger',
  EXPIRED: 'danger',
});

/** Hành động đổi trạng thái hợp lệ theo CAMPAIGN_TRANSITIONS ở server. */
const CAMPAIGN_ACTIONS = Object.freeze({
  DRAFT: [{ action: 'SCHEDULE', label: 'Lên lịch', variant: 'outline' }],
  SCHEDULED: [
    { action: 'ACTIVATE', label: 'Kích hoạt', variant: 'primary' },
    { action: 'END', label: 'Kết thúc', variant: 'outline' },
    { action: 'CANCEL', label: 'Hủy', variant: 'danger' },
  ],
  ACTIVE: [
    { action: 'END', label: 'Kết thúc', variant: 'outline' },
    { action: 'CANCEL', label: 'Hủy', variant: 'danger' },
  ],
  ENDED: [{ action: 'DRAFT', label: 'Về nháp', variant: 'outline' }],
  CANCELLED: [{ action: 'DRAFT', label: 'Về nháp', variant: 'outline' }],
});

export function campaignActions(status) {
  return CAMPAIGN_ACTIONS[status] ?? [];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
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

/** Việt Nam cố định UTC+7, không có giờ mùa hè. */
const VN_UTC_OFFSET_MINUTES = 7 * 60;

const INPUT_PART_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Ho_Chi_Minh',
});

/**
 * ISO → chuỗi cho <input type="datetime-local">, luôn theo giờ Việt Nam để khớp
 * `formatDateTime` dù trình duyệt của quản trị viên ở múi giờ khác.
 */
export function toDateTimeInput(value) {
  const stamp = parse(value);
  if (stamp == null) return '';
  const parts = {};
  for (const { type, value: part } of INPUT_PART_FORMATTER.formatToParts(new Date(stamp))) {
    parts[type] = part;
  }
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Chuỗi datetime-local (giờ Việt Nam) → ISO UTC để gửi API. */
export function fromDateTimeInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value ?? '').trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const utc = Date.UTC(year, month - 1, day, hour, minute) - VN_UTC_OFFSET_MINUTES * 60 * 1000;
  return Number.isFinite(utc) ? new Date(utc).toISOString() : null;
}
