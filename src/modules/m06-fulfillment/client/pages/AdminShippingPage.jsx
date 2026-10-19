/**
 * [TOY-M06] Đơn hàng và giao vận — AdminShippingPage
 * SRS: M06 | API/FR: M06-F09, M06-F10, M06-F12, API-M06-02, API-M06-03, API-M06-07
 * Route: /admin/shipping
 * Render: Client Component (tương tác) — TODO(M06-F09).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng vận đơn, tạo fulfillment và in label/phiếu giao.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F09): dựng màn hình giao vận, tạo vận đơn và duyệt đổi trả.
export default function AdminShippingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M06"
        moduleName="Đơn hàng và giao vận"
        componentName="AdminShippingPage"
        route="/admin/shipping"
        srsRefs={['M06-F09', 'M06-F10', 'M06-F12', 'API-M06-02', 'API-M06-03', 'API-M06-07']}
        todos={[
          'Dựng bảng vận đơn, tạo fulfillment và in label/phiếu giao.',
          'Theo dõi webhook ĐVVC; xử lý giao thất bại tối đa 3 lần (BR-M06-03).',
          'Duyệt/từ chối yêu cầu đổi trả qua API-M06-07 (M06-F12).',
        ]}
        description="Màn hình giao vận back-office: tạo vận đơn, bàn giao ĐVVC, theo dõi hành trình và duyệt đổi trả."
      />
    </div>
  );
}
