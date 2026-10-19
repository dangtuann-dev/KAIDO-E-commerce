'use client';

/**
 * [TOY-M04] Giỏ hàng — OutOfStockAlert
 * SRS: M04-F09 | BR: BR-M04-02, BR-M04-03
 * Route: /cart
 * UI: Banner cảnh báo giá thay đổi và item hết hàng/ngừng bán; vô hiệu hóa checkbox.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M04-F09): So sánh giá snapshot trong giỏ với giá hiện tại; xử lý disabled item.
export default function OutOfStockAlert() {
  return (
    <ModuleStub
      moduleCode="TOY-M04"
      moduleName="Giỏ hàng"
      componentName="OutOfStockAlert"
      route="/cart"
      srsRefs={['M04-F09', 'BR-M04-02', 'BR-M04-03']}
      todos={[
        'So sánh giá snapshot trong giỏ với giá hiện tại; xử lý disabled item.',
        'Giữ component thuần UI, nhận dữ liệu qua props từ page/component cha.',
      ]}
      description="Banner cảnh báo giá thay đổi và item hết hàng/ngừng bán; vô hiệu hóa checkbox."
      headingLevel="h2"
    />
  );
}
