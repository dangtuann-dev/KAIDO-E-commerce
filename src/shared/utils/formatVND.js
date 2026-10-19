/**
 * Định dạng tiền Việt Nam: 290000 -> "290.000đ" (không thập phân) — Blueprint §0
 */
export function formatVND(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '0đ';
  const rounded = Math.round(value);
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(rounded)}đ`;
}

export function parseVNDInput(value) {
  if (typeof value === 'number') return value;
  const digits = String(value ?? '').replace(/[^\d-]/g, '');
  return digits ? Number(digits) : 0;
}
