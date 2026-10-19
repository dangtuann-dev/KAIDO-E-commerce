'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — CarrierTrackingCard
 * SRS: M06-F10, M06-F11 | API: API-M06-03, API-M06-04 | BR: BR-M06-03
 * Route: /account/orders/[orderRef]
 * UI: Thông tin ĐVVC, mã vận đơn, lịch sử cập nhật; cảnh báo sau 3 lần giao thất bại.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F10): Nối dữ liệu tracking; webhook ĐVVC cần HMAC ở server (API-M06-04).
export default function CarrierTrackingCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="CarrierTrackingCard"
      route="/account/orders/[orderRef]"
      srsRefs={['M06-F10', 'M06-F11', 'API-M06-03', 'API-M06-04', 'BR-M06-03']}
      todos={[
        'Nối dữ liệu tracking; webhook ĐVVC cần HMAC ở server (API-M06-04).',
        'Nối API-M06-03, API-M06-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Thông tin ĐVVC, mã vận đơn, lịch sử cập nhật; cảnh báo sau 3 lần giao thất bại."
      headingLevel="h2"
    />
  );
}
