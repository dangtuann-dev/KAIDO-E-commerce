/**
 * [TOY-M08] Nhãn hiển thị dùng chung cho client.
 */
export const STOCK_STATUS_LABELS = Object.freeze({
  IN_STOCK: 'Còn hàng',
  LOW_STOCK: 'Sắp hết',
  OUT_OF_STOCK: 'Hết hàng',
});

export const STOCK_STATUS_TONES = Object.freeze({
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
});

export const DOCUMENT_STATUS_LABELS = Object.freeze({
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  CANCELLED: 'Đã hủy',
});

export const DOCUMENT_STATUS_TONES = Object.freeze({
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  CANCELLED: 'danger',
});

export const MOVEMENT_TYPE_LABELS = Object.freeze({
  IMPORT: 'Nhập kho',
  EXPORT: 'Xuất kho',
  RESERVE: 'Giữ tồn',
  RELEASE: 'Nhả tồn',
  FULFILL: 'Xuất bán',
  ADJUST: 'Điều chỉnh',
  TRANSFER_IN: 'Nhận chuyển kho',
  TRANSFER_OUT: 'Xuất chuyển kho',
  RETURN: 'Hàng hoàn',
});

export const TRANSFER_STATUS_LABELS = Object.freeze({
  DRAFT: 'Nháp',
  APPROVED: 'Đang chuyển / đã nhận',
  CANCELLED: 'Đã hủy',
});

export function transferStage(transfer) {
  if (!transfer) return '';
  if (transfer.status === 'CANCELLED') return 'Đã hủy';
  if (transfer.received_at) return 'Đã nhận hàng';
  if (transfer.status === 'APPROVED') return 'Đang trên đường';
  return 'Nháp — chưa xuất kho';
}

export function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}
