/**
 * [TOY-M08] Kho và tồn kho — AdminStockCardPage
 * SRS: M08 | API/FR: M08-F13, API-M08-07, NFR-M08-03, SYS-NFR-07
 * Route: /admin/inventory/stock-cards
 * Render: Client Component (tương tác) — TODO(M08-F13).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng InventoryHistoryLog: người thực hiện, thời gian, loại giao dịch, số dư trước/sau.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F13): dựng bảng thẻ kho và nối API-M08-07.
export default function AdminStockCardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M08"
        moduleName="Kho và tồn kho"
        componentName="AdminStockCardPage"
        route="/admin/inventory/stock-cards"
        srsRefs={['M08-F13', 'API-M08-07', 'NFR-M08-03', 'SYS-NFR-07']}
        todos={[
          'Dựng InventoryHistoryLog: người thực hiện, thời gian, loại giao dịch, số dư trước/sau.',
          'Nối API-M08-07 theo khoảng ngày và SKU.',
          'Ghi chú tính bất biến của stock_movement_logs (NFR-M08-03).',
        ]}
        description="Sổ thẻ kho bất biến, truy vết mọi biến động nhập/xuất/điều chỉnh theo chứng từ."
      />
    </div>
  );
}
