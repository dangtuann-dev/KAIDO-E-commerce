'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderTrackingTimeline
 * SRS: M05-F10, M06-F03 | API: API-M06-03 | BR: BR-M06-01
 * Route: /account/orders/[orderRef], /order-success/[code]
 * UI: Timeline 13 trạng thái thống nhất kèm thời điểm và ghi chú.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F10): Nối useGetOrderTracking và hiển thị trạng thái hiện tại nổi bật.
export default function OrderTrackingTimeline() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="OrderTrackingTimeline"
      route="/account/orders/[orderRef]"
      srsRefs={['M05-F10', 'M06-F03', 'API-M06-03', 'BR-M06-01']}
      todos={[
        'Nối useGetOrderTracking và hiển thị trạng thái hiện tại nổi bật.',
        'Nối API-M06-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Timeline 13 trạng thái thống nhất kèm thời điểm và ghi chú."
      headingLevel="h2"
    />
  );
}
