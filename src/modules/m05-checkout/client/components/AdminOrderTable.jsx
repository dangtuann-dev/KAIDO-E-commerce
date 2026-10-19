'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderTable
 * SRS: M05-F11, M06-F05 | API: API-M05-06, API-M05-07 | BR: BR-M06-01
 * Route: /admin/orders
 * UI: Bảng đơn có lọc trạng thái, từ khóa, khoảng ngày; badge trạng thái và thao tác nhanh.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F11): Nối useListAdminOrders; giới hạn chuyển trạng thái theo ORDER_TRANSITIONS.
export default function AdminOrderTable() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="AdminOrderTable"
      route="/admin/orders"
      srsRefs={['M05-F11', 'M06-F05', 'API-M05-06', 'API-M05-07', 'BR-M06-01']}
      todos={[
        'Nối useListAdminOrders; giới hạn chuyển trạng thái theo ORDER_TRANSITIONS.',
        'Nối API-M05-06, API-M05-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng đơn có lọc trạng thái, từ khóa, khoảng ngày; badge trạng thái và thao tác nhanh."
      headingLevel="h2"
    />
  );
}
