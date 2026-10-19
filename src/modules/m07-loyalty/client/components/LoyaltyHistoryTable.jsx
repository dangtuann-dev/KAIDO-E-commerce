'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — LoyaltyHistoryTable
 * SRS: M07-F07 | API: API-M07-03 | BR: BR-M07-01
 * Route: /account/loyalty/history
 * UI: Bảng nhật ký cộng/trừ điểm, lý do, mã đơn và ngày hết hạn lô điểm.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F07): Nối useGetPointHistory với phân trang 20 dòng.
export default function LoyaltyHistoryTable() {
  return (
    <ModuleStub
      moduleCode="TOY-M07"
      moduleName="Khuyến mãi và khách thân thiết"
      componentName="LoyaltyHistoryTable"
      route="/account/loyalty/history"
      srsRefs={['M07-F07', 'API-M07-03', 'BR-M07-01']}
      todos={[
        'Nối useGetPointHistory với phân trang 20 dòng.',
        'Nối API-M07-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng nhật ký cộng/trừ điểm, lý do, mã đơn và ngày hết hạn lô điểm."
      headingLevel="h2"
    />
  );
}
