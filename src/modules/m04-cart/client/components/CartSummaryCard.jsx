'use client';

/**
 * [TOY-M04] Giỏ hàng — CartSummaryCard
 * SRS: M04-F05, M04-F06, M04-F07 | API: API-M04-07 | BR: BR-M04-05
 * Route: /cart
 * UI: Tóm tắt tạm tính, giảm giá, tổng tiền; CTA thanh toán các dòng đã chọn.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M04-F05): Nối useGetCart/useApplyCouponToCart và trạng thái chưa chọn sản phẩm.
export default function CartSummaryCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M04"
      moduleName="Giỏ hàng"
      componentName="CartSummaryCard"
      route="/cart"
      srsRefs={['M04-F05', 'M04-F06', 'M04-F07', 'API-M04-07', 'BR-M04-05']}
      todos={[
        'Nối useGetCart/useApplyCouponToCart và trạng thái chưa chọn sản phẩm.',
        'Nối API-M04-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Tóm tắt tạm tính, giảm giá, tổng tiền; CTA thanh toán các dòng đã chọn."
      headingLevel="h2"
    />
  );
}
