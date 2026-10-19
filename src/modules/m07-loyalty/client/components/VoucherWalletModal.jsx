'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — VoucherWalletModal
 * SRS: M07-F02 | API: API-M07-01 | BR: BR-M09-01, BR-M09-02
 * Route: /cart, /checkout, /account/loyalty
 * UI: Danh sách voucher khả dụng/hết hạn, chọn áp dụng và xem điều kiện.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F02): Nối useValidateVoucher; mọi voucher dùng CouponService M09.
export default function VoucherWalletModal() {
  return (
    <ModuleStub
      moduleCode="TOY-M07"
      moduleName="Khuyến mãi và khách thân thiết"
      componentName="VoucherWalletModal"
      route="/cart"
      srsRefs={['M07-F02', 'API-M07-01', 'BR-M09-01', 'BR-M09-02']}
      todos={[
        'Nối useValidateVoucher; mọi voucher dùng CouponService M09.',
        'Nối API-M07-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Danh sách voucher khả dụng/hết hạn, chọn áp dụng và xem điều kiện."
      headingLevel="h2"
    />
  );
}
