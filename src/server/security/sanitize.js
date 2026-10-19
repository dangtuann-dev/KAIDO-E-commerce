import 'server-only';

/**
 * [SERVER] Loại thẻ HTML khỏi chuỗi đầu vào — NFR-M03-04.
 * Không thay thế cho validate Zod; dùng trước khi lưu các trường văn bản tự do.
 */
const SCRIPT_STYLE_BLOCK = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HTML_TAG = /<\/?[a-zA-Z!][^>]*>/g;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * @param {unknown} input
 * @returns {string}
 */
export function stripHtml(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(SCRIPT_STYLE_BLOCK, ' ')
    .replace(HTML_COMMENT, ' ')
    .replace(HTML_TAG, ' ')
    .replace(CONTROL_CHARACTERS, '')
    .trim();
}

/**
 * Làm sạch văn bản nhiều dòng, giữ xuống dòng để hiển thị review/mô tả.
 * @param {unknown} input
 * @param {{ maxLength?: number }} [options]
 * @returns {string}
 */
export function sanitizeText(input, options = {}) {
  const cleaned = stripHtml(input)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const maxLength = Number(options.maxLength);
  return Number.isFinite(maxLength) && maxLength > 0 ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Làm sạch từ khóa tìm kiếm: một dòng, không thẻ HTML.
 * @param {unknown} input
 * @param {{ maxLength?: number }} [options]
 * @returns {string}
 */
export function sanitizeSearchKeyword(input, options = {}) {
  return sanitizeText(input, options).replace(/\s+/g, ' ').trim();
}
