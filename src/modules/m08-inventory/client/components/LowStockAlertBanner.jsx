'use client';

/**
 * [TOY-M08] Kho và tồn kho — LowStockAlertBanner
 * SRS: M08-F11, M02-F13 | API: API-M08-01
 * Route: /admin, /admin/inventory
 * UI: Banner cảnh báo số SKU sắp hết hàng kèm liên kết lọc danh sách.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F11): Nối useCheckStock và cron low-stock-scan; hiển thị số lượng cảnh báo thật.
export default function LowStockAlertBanner() {
  return (
    <ModuleStub
      moduleCode="TOY-M08"
      moduleName="Kho và tồn kho"
      componentName="LowStockAlertBanner"
      route="/admin"
      srsRefs={['M08-F11', 'M02-F13', 'API-M08-01']}
      todos={[
        'Nối useCheckStock và cron low-stock-scan; hiển thị số lượng cảnh báo thật.',
        'Nối API-M08-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Banner cảnh báo số SKU sắp hết hàng kèm liên kết lọc danh sách."
      headingLevel="h2"
    />
  );
}
