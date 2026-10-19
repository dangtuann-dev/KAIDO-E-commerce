/**
 * [TOY-M06] Đơn hàng và giao vận — OrderDetailPage
 * SRS: M06 | API/FR: M06-F02, M06-F03, M06-F04, API-M05-03, API-M06-03, API-M06-05
 * Route: /account/orders/[orderRef]
 * Render: Client Component (tương tác) — TODO(M06-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Hiển thị hàng hóa, thanh toán, địa chỉ nhận và timeline vận chuyển.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F03): dựng chi tiết đơn, timeline tracking và nối API-M06-03.
export default function OrderDetailPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M06"
        moduleName="Đơn hàng và giao vận"
        componentName="OrderDetailPage"
        route="/account/orders/[orderRef]"
        srsRefs={['M06-F02', 'M06-F03', 'M06-F04', 'API-M05-03', 'API-M06-03', 'API-M06-05']}
        todos={[
          'Hiển thị hàng hóa, thanh toán, địa chỉ nhận và timeline vận chuyển.',
          'Cho hủy đơn ở PENDING/CONFIRMED qua API-M06-05 (BR-M05-04).',
          'Nối API-M06-03 và xử lý trạng thái không có vận đơn.',
        ]}
        description="Chi tiết đơn của khách kèm timeline giao vận và thao tác hủy/đổi trả trong chính sách."
      />
    </div>
  );
}
