'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — FulfillmentActions
 * SRS: M06-F05, M06-F06, M06-F07, M06-F09, M06-F12 | API: API-M05-07, API-M06-02, API-M06-07
 * Route: /admin/orders/[id], /admin/shipping
 * UI: Nút xác nhận đơn, đóng gói, tạo vận đơn, in phiếu giao và duyệt đổi trả.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F05): Nối useUpdateOrderStatus/useCreateFulfillment/useApproveReturnRequest và kiểm tra quyền.
export default function FulfillmentActions() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="FulfillmentActions"
      route="/admin/orders/[id]"
      srsRefs={[
        'M06-F05',
        'M06-F06',
        'M06-F07',
        'M06-F09',
        'M06-F12',
        'API-M05-07',
        'API-M06-02',
        'API-M06-07',
      ]}
      todos={[
        'Nối useUpdateOrderStatus/useCreateFulfillment/useApproveReturnRequest và kiểm tra quyền.',
        'Nối API-M05-07, API-M06-02, API-M06-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Nút xác nhận đơn, đóng gói, tạo vận đơn, in phiếu giao và duyệt đổi trả."
      headingLevel="h2"
    />
  );
}
