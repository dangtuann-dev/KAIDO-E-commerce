'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — PromoCodeBadgeList
 * SRS: M09-F03, M09-F08 | API: API-M09-02, API-M09-03 | BR: BR-M09-02
 * Route: /promotions, /cart
 * UI: Danh sách mã khuyến mãi kèm nút sao chép và điều kiện sử dụng.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F03): Nối useGetActivePromotions/useVerifyCoupon; vô hiệu hóa mã hết lượt.
export default function PromoCodeBadgeList() {
  return (
    <ModuleStub
      moduleCode="TOY-M09"
      moduleName="Nội dung và chiến dịch quảng bá"
      componentName="PromoCodeBadgeList"
      route="/promotions"
      srsRefs={['M09-F03', 'M09-F08', 'API-M09-02', 'API-M09-03', 'BR-M09-02']}
      todos={[
        'Nối useGetActivePromotions/useVerifyCoupon; vô hiệu hóa mã hết lượt.',
        'Nối API-M09-02, API-M09-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Danh sách mã khuyến mãi kèm nút sao chép và điều kiện sử dụng."
      headingLevel="h2"
    />
  );
}
