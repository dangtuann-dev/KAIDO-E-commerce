'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — CheckoutShippingForm
 * SRS: M05-F02, M05-F03 | API: API-M05-02, API-M06-01 | BR: BR-M05-01
 * Route: /checkout
 * UI: Form họ tên, SĐT, dropdown Tỉnh → Huyện → Xã 3 cấp và địa chỉ cụ thể; chọn vận chuyển.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F02): Dựng RHF + Zod; nối usePlaceOrder/useCalculateShippingFee và reset select con khi cha đổi.
export default function CheckoutShippingForm() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="CheckoutShippingForm"
      route="/checkout"
      srsRefs={['M05-F02', 'M05-F03', 'API-M05-02', 'API-M06-01', 'BR-M05-01']}
      todos={[
        'Dựng RHF + Zod; nối usePlaceOrder/useCalculateShippingFee và reset select con khi cha đổi.',
        'Nối API-M05-02, API-M06-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Form họ tên, SĐT, dropdown Tỉnh → Huyện → Xã 3 cấp và địa chỉ cụ thể; chọn vận chuyển."
      headingLevel="h2"
    />
  );
}
