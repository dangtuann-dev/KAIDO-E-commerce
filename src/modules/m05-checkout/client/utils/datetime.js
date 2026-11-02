/**
 * [TOY-M05] Định dạng thời gian cho trang đơn hàng (Blueprint §0: ngày/giờ theo vi-VN).
 */

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
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
 * Khoảng thời gian còn lại dạng "12 phút 05 giây" (dùng cho hạn thanh toán 20 phút).
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} giây`;
  return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`;
}

/**
 * @param {string | null | undefined} expiresAt
 * @param {number} [now]
 * @returns {number} số mili giây còn lại (0 nếu đã hết hạn)
 */
export function remainingMs(expiresAt, now = Date.now()) {
  if (!expiresAt) return 0;
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, target - now);
}
