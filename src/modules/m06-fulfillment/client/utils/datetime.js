/**
 * [TOY-M06] Định dạng ngày giờ cho trang đơn hàng và giao vận (Blueprint §0).
 */

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(date);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

/**
 * Số ngày còn lại của cửa sổ đổi trả; 0 nếu đã hết hạn hoặc thiếu mốc thời gian.
 * @param {string | null | undefined} completedAt
 * @param {number} windowDays
 * @returns {number}
 */
export function remainingReturnDays(completedAt, windowDays) {
  if (!completedAt) return 0;
  const completed = new Date(completedAt).getTime();
  if (Number.isNaN(completed)) return 0;
  const deadline = completed + windowDays * 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}
