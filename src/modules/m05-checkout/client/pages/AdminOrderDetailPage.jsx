/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderDetailPage
 * SRS: M05 | API/FR: M05-F11, M06-F06, M06-F07, M06-F09, API-M05-07, API-M06-02
 * Route: /admin/orders/[id]
 * Render: Client Component (tương tác) — TODO(M05-F11).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Hiển thị thông tin đơn, lịch sử trạng thái và thanh toán.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F11): dựng chi tiết đơn admin, chuyển trạng thái hợp lệ và tạo vận đơn.
export default function AdminOrderDetailPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M05"
        moduleName="Đặt hàng và thanh toán"
        componentName="AdminOrderDetailPage"
        route="/admin/orders/[id]"
        srsRefs={['M05-F11', 'M06-F06', 'M06-F07', 'M06-F09', 'API-M05-07', 'API-M06-02']}
        todos={[
          'Hiển thị thông tin đơn, lịch sử trạng thái và thanh toán.',
          'Chỉ cho chuyển trạng thái theo ORDER_TRANSITIONS (M05-F11, BR-M06-01).',
          'Tạo vận đơn, in phiếu giao và duyệt đổi trả (M06-F09, M06-F12).',
        ]}
        description="Chi tiết đơn trong back-office: xác nhận, đóng gói, tạo vận đơn và xử lý đổi trả."
      />
    </div>
  );
}
