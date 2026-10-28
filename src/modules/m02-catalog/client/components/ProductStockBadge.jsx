/**
 * [TOY-M02] Sản phẩm và danh mục — ProductStockBadge
 * SRS: M02-F09, M02-F13, BR-M02-05 | API: API-M02-02, API-M02-03
 * Tồn kho UNKNOWN nghĩa là M08 chưa có bản ghi — không coi là hết hàng.
 */
import Badge from '@/shared/ui/badge.jsx';

const STOCK_PRESENTATION = {
  IN_STOCK: { tone: 'success', label: 'Còn hàng' },
  LOW_STOCK: { tone: 'warning', label: 'Sắp hết hàng' },
  OUT_OF_STOCK: { tone: 'danger', label: 'Hết hàng' },
  UNKNOWN: { tone: 'neutral', label: 'Đang cập nhật tồn kho' },
};

export default function ProductStockBadge({ stock, showQuantity = false, className }) {
  const status = stock?.status ?? 'UNKNOWN';
  const presentation = STOCK_PRESENTATION[status] ?? STOCK_PRESENTATION.UNKNOWN;
  const quantity = Number(stock?.available);
  const label =
    showQuantity && status === 'LOW_STOCK' && Number.isFinite(quantity)
      ? `Chỉ còn ${quantity} sản phẩm`
      : presentation.label;

  return (
    <Badge tone={presentation.tone} className={className}>
      {label}
    </Badge>
  );
}
