/**
 * [TOY-M08] Kho và tồn kho — AdminInventoryPage
 * SRS: M08 | API/FR: M08-F03, M08-F04, API-M08-01, NFR-M08-02
 * Route: /admin/inventory
 * Render: Client Component (tương tác) — TODO(M08-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng tồn kho theo SKU/kho với 3 chỉ số on_hand, reserved, available.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F03): dựng bảng tồn kho 3 chỉ số và nối API-M08-01.
export default function AdminInventoryPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M08"
        moduleName="Kho và tồn kho"
        componentName="AdminInventoryPage"
        route="/admin/inventory"
        srsRefs={['M08-F03', 'M08-F04', 'API-M08-01', 'NFR-M08-02']}
        todos={[
          'Dựng bảng tồn kho theo SKU/kho với 3 chỉ số on_hand, reserved, available.',
          'Lọc theo danh mục, sắp hết và hết hàng; dùng StockLevelBadge.',
          'Nối API-M08-01; mục tiêu phản hồi < 100ms nhờ cache (NFR-M08-02).',
        ]}
        description="Tra cứu tồn kho khả dụng theo SKU và kho, phục vụ vận hành và kiểm soát bán hàng."
      />
    </div>
  );
}
