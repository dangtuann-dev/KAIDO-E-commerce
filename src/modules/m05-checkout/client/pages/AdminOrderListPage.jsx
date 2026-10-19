/**
 * [TOY-M05] Đặt hàng và thanh toán — AdminOrderListPage
 * SRS: M05 | API/FR: M05-F11, M06-F05, API-M05-06, API-M05-07
 * Route: /admin/orders
 * Render: Client Component (tương tác) — TODO(M05-F11).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng AdminOrderTable có lọc trạng thái, từ khóa, khoảng ngày.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F11): dựng bảng đơn admin, lọc trạng thái và nối API-M05-06.
export default function AdminOrderListPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M05"
        moduleName="Đặt hàng và thanh toán"
        componentName="AdminOrderListPage"
        route="/admin/orders"
        srsRefs={['M05-F11', 'M06-F05', 'API-M05-06', 'API-M05-07']}
        todos={[
          'Dựng AdminOrderTable có lọc trạng thái, từ khóa, khoảng ngày.',
          'Nối API-M05-06; liên kết chi tiết đơn để cập nhật trạng thái.',
          'Hiển thị badge trạng thái theo enum thống nhất 13 giá trị (BR-M06-01).',
        ]}
        description="Danh sách đơn hàng cho nhân viên/quản trị. M05 sở hữu đơn; M06 quản lý vòng đời giao vận."
      />
    </div>
  );
}
