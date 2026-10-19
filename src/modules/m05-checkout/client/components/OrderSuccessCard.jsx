'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSuccessCard
 * SRS: M05-F08 | API: API-M05-03 | BR: BR-M05-02
 * Route: /order-success/[code]
 * UI: Mã đơn, tổng tiền, phương thức thanh toán, thời gian giao dự kiến và CTA theo dõi.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F08): Nối useGetOrderDetail; poll trạng thái thanh toán online đến khi xác nhận/timeout 20 phút.
export default function OrderSuccessCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="OrderSuccessCard"
      route="/order-success/[code]"
      srsRefs={['M05-F08', 'API-M05-03', 'BR-M05-02']}
      todos={[
        'Nối useGetOrderDetail; poll trạng thái thanh toán online đến khi xác nhận/timeout 20 phút.',
        'Nối API-M05-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Mã đơn, tổng tiền, phương thức thanh toán, thời gian giao dự kiến và CTA theo dõi."
      headingLevel="h2"
    />
  );
}
