'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — CancelOrderModal
 * SRS: M06-F04 | API: API-M06-05 | BR: BR-M05-04, BR-M06-02
 * Route: /account/orders/[orderRef]
 * UI: Modal xác nhận hủy kèm lý do; chỉ hiện khi PENDING/CONFIRMED.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F04): Nối useCancelOrderFromFulfillment và ẩn thao tác khi đơn đã PACKING.
export default function CancelOrderModal() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="CancelOrderModal"
      route="/account/orders/[orderRef]"
      srsRefs={['M06-F04', 'API-M06-05', 'BR-M05-04', 'BR-M06-02']}
      todos={[
        'Nối useCancelOrderFromFulfillment và ẩn thao tác khi đơn đã PACKING.',
        'Nối API-M06-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Modal xác nhận hủy kèm lý do; chỉ hiện khi PENDING/CONFIRMED."
      headingLevel="h2"
    />
  );
}
