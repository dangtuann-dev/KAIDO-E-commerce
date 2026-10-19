/**
 * [TOY-M08] Kho và tồn kho — AdminDashboardPage
 * SRS: M08 | API/FR: M08-F11, M08-F03, M02-F13, API-M08-01
 * Route: /admin
 * Render: Client Component (tương tác) — TODO(M08-F11).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng LowStockAlertBanner và các chỉ số on_hand/reserved/available.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F11): dựng dashboard có cảnh báo tồn kho thấp và nối API-M08-01.
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M08"
        moduleName="Kho và tồn kho"
        componentName="AdminDashboardPage"
        route="/admin"
        srsRefs={['M08-F11', 'M08-F03', 'M02-F13', 'API-M08-01']}
        todos={[
          'Dựng LowStockAlertBanner và các chỉ số on_hand/reserved/available.',
          'Tổng hợp lối tắt theo module và trạng thái vận hành.',
          'Nối dữ liệu tồn kho qua API-M08-01 (cache Redis khi triển khai).',
        ]}
        description="Trang tổng quan back-office. Hiển thị cảnh báo tồn kho thấp và lối vào các module quản trị."
      />
    </div>
  );
}
