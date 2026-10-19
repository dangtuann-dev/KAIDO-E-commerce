'use client';

/**
 * [TOY-M08] Kho và tồn kho — StockAuditTable
 * SRS: M08-F09 | API: API-M08-06 | BR: BR-M08-05 | NFR: NFR-M08-03
 * Route: /admin/inventory/audit
 * UI: Bảng kiểm kê nhập số đếm thực tế, tự tính chênh lệch; chặn sửa phiếu COMPLETED.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M08-F09): Nối useCreateStockAdjustment; lệch > 5.000.000đ hoặc > 10 sản phẩm cần Admin duyệt.
export default function StockAuditTable() {
  return (
    <ModuleStub
      moduleCode="TOY-M08"
      moduleName="Kho và tồn kho"
      componentName="StockAuditTable"
      route="/admin/inventory/audit"
      srsRefs={['M08-F09', 'API-M08-06', 'BR-M08-05', 'NFR-M08-03']}
      todos={[
        'Nối useCreateStockAdjustment; lệch > 5.000.000đ hoặc > 10 sản phẩm cần Admin duyệt.',
        'Nối API-M08-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng kiểm kê nhập số đếm thực tế, tự tính chênh lệch; chặn sửa phiếu COMPLETED."
      headingLevel="h2"
    />
  );
}
