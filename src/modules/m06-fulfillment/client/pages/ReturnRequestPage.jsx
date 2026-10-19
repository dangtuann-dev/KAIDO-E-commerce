/**
 * [TOY-M06] Đơn hàng và giao vận — ReturnRequestPage
 * SRS: M06 | API/FR: M06-F12, API-M06-06, BR-M06-05
 * Route: /account/orders/[orderRef]/return
 * Render: Client Component (tương tác) — TODO(M06-F12).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Chỉ cho đổi trả trong 7 ngày kể từ lúc nhận, đơn COMPLETED (BR-M06-05).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F12): dựng form đổi trả 7 ngày và nối API-M06-06.
export default function ReturnRequestPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M06"
        moduleName="Đơn hàng và giao vận"
        componentName="ReturnRequestPage"
        route="/account/orders/[orderRef]/return"
        srsRefs={['M06-F12', 'API-M06-06', 'BR-M06-05']}
        todos={[
          'Chỉ cho đổi trả trong 7 ngày kể từ lúc nhận, đơn COMPLETED (BR-M06-05).',
          'Chọn sản phẩm, lý do và tải tối thiểu 1 ảnh minh chứng.',
          'Nối API-M06-06; hiển thị trạng thái PENDING_APPROVAL sau khi gửi.',
        ]}
        description="Form gửi yêu cầu đổi trả/hoàn tiền (RMA). Nhân viên duyệt ở màn hình giao vận admin."
      />
    </div>
  );
}
