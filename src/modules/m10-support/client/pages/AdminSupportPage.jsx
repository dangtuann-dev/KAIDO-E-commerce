/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminSupportPage
 * SRS: M10 | API/FR: M10-F08, M10-F11, API-M10-04, API-M10-05, BR-M10-04
 * Route: /admin/support
 * Render: Client Component (tương tác) — TODO(M10-F08).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng dashboard CSKH: danh sách ticket, bộ lọc trạng thái/ưu tiên.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F08): dựng dashboard CSKH và nối API-M10-04/API-M10-05.
export default function AdminSupportPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="AdminSupportPage"
        route="/admin/support"
        srsRefs={['M10-F08', 'M10-F11', 'API-M10-04', 'API-M10-05', 'BR-M10-04']}
        todos={[
          'Dựng dashboard CSKH: danh sách ticket, bộ lọc trạng thái/ưu tiên.',
          'Phản hồi ticket qua API-M10-05; tự đóng sau 72 giờ RESOLVED (BR-M10-04).',
          'Bổ sung API admin danh sách ticket — SRS chưa liệt kê (OPEN_DECISIONS).',
        ]}
        description="Màn hình tiếp nhận và xử lý ticket hỗ trợ của nhân viên CSKH."
      />
    </div>
  );
}
