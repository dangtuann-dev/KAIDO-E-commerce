/**
 * [TOY-M06] Đơn hàng và giao vận — OrderListPage
 * SRS: M06 | API/FR: M06-F02, M05-F10, API-M05-03
 * Route: /account/orders
 * Render: Client Component (tương tác) — TODO(M06-F02).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng đơn của khách với bộ lọc trạng thái và phân trang.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F02): dựng lịch sử đơn của khách và bổ sung API danh sách đơn.
export default function OrderListPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M06"
        moduleName="Đơn hàng và giao vận"
        componentName="OrderListPage"
        route="/account/orders"
        srsRefs={['M06-F02', 'M05-F10', 'API-M05-03']}
        todos={[
          'Dựng bảng đơn của khách với bộ lọc trạng thái và phân trang.',
          'Bổ sung API danh sách đơn của khách — SRS chỉ có chi tiết đơn (OPEN_DECISIONS).',
          'Liên kết chi tiết, hủy đơn và yêu cầu đổi trả.',
        ]}
        description="Lịch sử đơn hàng của khách. Dữ liệu đơn do M05 sở hữu, truy cập qua public.server.js của M05."
      />
    </div>
  );
}
