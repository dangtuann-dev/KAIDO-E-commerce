'use client';

/**
 * [TOY-M04] Giỏ hàng — CartItemRow
 * SRS: M04-F03, M04-F04, M04-F06 | API: API-M04-03, API-M04-04 | BR: BR-M04-01, BR-M04-05, BR-M04-06
 * Route: /cart
 * UI: Dòng giỏ hàng có checkbox chọn, ảnh, biến thể, stepper số lượng, nút xóa và Undo 5 giây.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M04-F03): Dựng RHF cho số lượng, nối update/remove và chặn vượt 20 đơn vị/SKU (BR-M04-05).
export default function CartItemRow() {
  return (
    <ModuleStub
      moduleCode="TOY-M04"
      moduleName="Giỏ hàng"
      componentName="CartItemRow"
      route="/cart"
      srsRefs={[
        'M04-F03',
        'M04-F04',
        'M04-F06',
        'API-M04-03',
        'API-M04-04',
        'BR-M04-01',
        'BR-M04-05',
        'BR-M04-06',
      ]}
      todos={[
        'Dựng RHF cho số lượng, nối update/remove và chặn vượt 20 đơn vị/SKU (BR-M04-05).',
        'Nối API-M04-03, API-M04-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Dòng giỏ hàng có checkbox chọn, ảnh, biến thể, stepper số lượng, nút xóa và Undo 5 giây."
      headingLevel="h2"
    />
  );
}
