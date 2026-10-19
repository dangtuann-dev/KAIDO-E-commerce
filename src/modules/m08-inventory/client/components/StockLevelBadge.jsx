/**
 * [TOY-M08] Kho và tồn kho — StockLevelBadge
 * SRS: M08-F03, API-M08-01, BR-M08-01, BR-M08-03
 * Route: /admin/inventory, /admin/products
 * UI: Nhãn tồn kho: Còn hàng, Sắp hết, Hết hàng; ngưỡng mặc định 5.
 */
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import Badge from '@/shared/ui/badge.jsx';

export default function StockLevelBadge({
  available,
  threshold = BUSINESS_RULES.CATALOG.DEFAULT_LOW_STOCK_THRESHOLD,
  showCount = true,
  className,
}) {
  const quantity = Number(available);

  if (!Number.isFinite(quantity)) {
    return (
      <Badge tone="neutral" className={className}>
        Chưa có dữ liệu tồn
      </Badge>
    );
  }

  const safeQuantity = Math.max(0, Math.floor(quantity));

  if (safeQuantity <= 0) {
    return (
      <Badge tone="danger" className={className}>
        Hết hàng
      </Badge>
    );
  }

  if (safeQuantity <= threshold) {
    return (
      <Badge tone="warning" className={className}>
        Sắp hết{showCount ? ` · còn ${safeQuantity}` : ''}
      </Badge>
    );
  }

  return (
    <Badge tone="success" className={cn(className)}>
      Còn hàng{showCount ? ` · ${safeQuantity}` : ''}
    </Badge>
  );
}
