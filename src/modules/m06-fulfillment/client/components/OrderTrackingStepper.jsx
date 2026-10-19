'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — OrderTrackingStepper
 * SRS: M06-F03 | API: API-M06-03 | BR: BR-M06-01
 * Route: /account/orders/[orderRef]
 * UI: Stepper dọc/ngang thể hiện đúng thứ tự PENDING → COMPLETED, không nhảy cóc.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F03): Nối useGetOrderTracking và xử lý trạng thái hủy/giao thất bại.
export default function OrderTrackingStepper() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="OrderTrackingStepper"
      route="/account/orders/[orderRef]"
      srsRefs={['M06-F03', 'API-M06-03', 'BR-M06-01']}
      todos={[
        'Nối useGetOrderTracking và xử lý trạng thái hủy/giao thất bại.',
        'Nối API-M06-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Stepper dọc/ngang thể hiện đúng thứ tự PENDING → COMPLETED, không nhảy cóc."
      headingLevel="h2"
    />
  );
}
