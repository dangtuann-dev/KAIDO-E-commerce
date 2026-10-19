/**
 * [TOY-M08] Kho và tồn kho — AdminStockAuditPage
 * SRS: M08 | API/FR: M08-F09, API-M08-06, BR-M08-05
 * Route: /admin/inventory/audit
 * Render: Client Component (tương tác) — TODO(M08-F09).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng StockAuditTable nhập số đếm thực tế và tự tính chênh lệch.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F09): dựng bảng kiểm kê và nối API-M08-06.
export default function AdminStockAuditPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M08"
        moduleName="Kho và tồn kho"
        componentName="AdminStockAuditPage"
        route="/admin/inventory/audit"
        srsRefs={['M08-F09', 'API-M08-06', 'BR-M08-05']}
        todos={[
          'Dựng StockAuditTable nhập số đếm thực tế và tự tính chênh lệch.',
          'Bắt buộc Quản trị viên duyệt khi lệch > 5.000.000đ hoặc > 10 sản phẩm.',
          'Nối API-M08-06; chặn sửa phiếu đã COMPLETED (BR-M08-05).',
        ]}
        description="Kiểm kê và điều chỉnh tồn kho, có luồng phê duyệt theo ngưỡng chênh lệch M08-F09."
      />
    </div>
  );
}
