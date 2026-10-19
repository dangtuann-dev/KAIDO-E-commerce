'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — FlashSaleCountdownBar
 * SRS: M09-F03, M09-F04, M09-F07 | API: API-M09-02 | BR: BR-M09-01
 * Route: /, /promotions
 * UI: Thanh đếm ngược flash sale theo thời gian chiến dịch, tự ẩn khi hết hạn.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F03): Nối useGetActivePromotions; đồng bộ đồng hồ server để tránh lệch.
export default function FlashSaleCountdownBar() {
  return (
    <ModuleStub
      moduleCode="TOY-M09"
      moduleName="Nội dung và chiến dịch quảng bá"
      componentName="FlashSaleCountdownBar"
      route="/"
      srsRefs={['M09-F03', 'M09-F04', 'M09-F07', 'API-M09-02', 'BR-M09-01']}
      todos={[
        'Nối useGetActivePromotions; đồng bộ đồng hồ server để tránh lệch.',
        'Nối API-M09-02 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Thanh đếm ngược flash sale theo thời gian chiến dịch, tự ẩn khi hết hạn."
      headingLevel="h2"
    />
  );
}
