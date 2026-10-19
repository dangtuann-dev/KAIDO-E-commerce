'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — PaymentMethodSelector
 * SRS: M05-F04, M05-F07 | API: API-M05-02 | BR: BR-M05-02, BR-M05-03
 * Route: /checkout
 * UI: Chỉ COD, VNPAY, MoMo, ZaloPay; tuyệt đối không có form thẻ tín dụng (SYS-NFR-04).
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F04): Hiển thị phí/ưu đãi từng phương thức; nối thanh toán online qua API-M05-04.
export default function PaymentMethodSelector() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="PaymentMethodSelector"
      route="/checkout"
      srsRefs={['M05-F04', 'M05-F07', 'API-M05-02', 'BR-M05-02', 'BR-M05-03']}
      todos={[
        'Hiển thị phí/ưu đãi từng phương thức; nối thanh toán online qua API-M05-04.',
        'Nối API-M05-02 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Chỉ COD, VNPAY, MoMo, ZaloPay; tuyệt đối không có form thẻ tín dụng (SYS-NFR-04)."
      headingLevel="h2"
    />
  );
}
