'use client';

/**
 * [TOY-M04] Giỏ hàng — CouponInputBox
 * SRS: M04-F07 | API: API-M04-07 | BR: BR-M09-02, BR-M09-03
 * Route: /cart
 * UI: Ô nhập voucher, hiển thị giảm giá hợp lệ và lỗi; mỗi đơn tối đa 1 coupon.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M04-F07): Nối useApplyCouponToCart; mọi xác thực mã đi qua CouponService M09.
export default function CouponInputBox() {
  return (
    <ModuleStub
      moduleCode="TOY-M04"
      moduleName="Giỏ hàng"
      componentName="CouponInputBox"
      route="/cart"
      srsRefs={['M04-F07', 'API-M04-07', 'BR-M09-02', 'BR-M09-03']}
      todos={[
        'Nối useApplyCouponToCart; mọi xác thực mã đi qua CouponService M09.',
        'Nối API-M04-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Ô nhập voucher, hiển thị giảm giá hợp lệ và lỗi; mỗi đơn tối đa 1 coupon."
      headingLevel="h2"
    />
  );
}
