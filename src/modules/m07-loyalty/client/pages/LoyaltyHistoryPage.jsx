/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — LoyaltyHistoryPage
 * SRS: M07 | API/FR: M07-F07, API-M07-03
 * Route: /account/loyalty/history
 * Render: Client Component (tương tác) — TODO(M07-F07).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng nhật ký cộng/trừ điểm kèm lý do và mã hóa đơn.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F07): dựng bảng lịch sử điểm và nối API-M07-03.
export default function LoyaltyHistoryPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M07"
        moduleName="Khuyến mãi và khách thân thiết"
        componentName="LoyaltyHistoryPage"
        route="/account/loyalty/history"
        srsRefs={['M07-F07', 'API-M07-03']}
        todos={[
          'Dựng bảng nhật ký cộng/trừ điểm kèm lý do và mã hóa đơn.',
          'Hiển thị ngày hết hạn của từng lô điểm (365 ngày).',
          'Nối API-M07-03 với phân trang 20 dòng.',
        ]}
        description="Lịch sử biến động điểm thưởng minh bạch theo từng giao dịch và đơn hàng liên quan."
      />
    </div>
  );
}
