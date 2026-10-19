'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — DeliveryDashboard
 * SRS: M06-F05, M06-F10, M06-F11, M06-F14 | API: API-M05-06, API-M06-03
 * Route: /admin/shipping
 * UI: Bảng vận đơn theo ĐVVC/trạng thái, bộ lọc và thống kê giao thành công/thất bại.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F05): Nối useListAdminOrders; API báo cáo M06-F14 chưa có trong SRS (TODO).
export default function DeliveryDashboard() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="DeliveryDashboard"
      route="/admin/shipping"
      srsRefs={['M06-F05', 'M06-F10', 'M06-F11', 'M06-F14', 'API-M05-06', 'API-M06-03']}
      todos={[
        'Nối useListAdminOrders; API báo cáo M06-F14 chưa có trong SRS (TODO).',
        'Nối API-M05-06, API-M06-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng vận đơn theo ĐVVC/trạng thái, bộ lọc và thống kê giao thành công/thất bại."
      headingLevel="h2"
    />
  );
}
