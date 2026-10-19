'use client';

/**
 * [TOY-M08] Kho và tồn kho — InventoryHistoryLog
 * SRS: M08-F13 | API: API-M08-07 | NFR: NFR-M08-03
 * Route: /admin/inventory/stock-cards
 * UI: Bảng thẻ kho bất biến: người thực hiện, thời gian, loại giao dịch, số dư trước/sau.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F13): Nối useGetStockCard theo SKU/khoảng ngày; không cho sửa log.
export default function InventoryHistoryLog() {
  return (
    <ModuleStub
      moduleCode="TOY-M08"
      moduleName="Kho và tồn kho"
      componentName="InventoryHistoryLog"
      route="/admin/inventory/stock-cards"
      srsRefs={['M08-F13', 'API-M08-07', 'NFR-M08-03']}
      todos={[
        'Nối useGetStockCard theo SKU/khoảng ngày; không cho sửa log.',
        'Nối API-M08-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng thẻ kho bất biến: người thực hiện, thời gian, loại giao dịch, số dư trước/sau."
      headingLevel="h2"
    />
  );
}
