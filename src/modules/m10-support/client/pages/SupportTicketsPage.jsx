/**
 * [TOY-M10] Hỗ trợ và đánh giá — SupportTicketsPage
 * SRS: M10 | API/FR: M10-F06, M10-F07, API-M10-03
 * Route: /account/support
 * Render: Client Component (tương tác) — TODO(M10-F06).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng danh sách ticket của khách và form tạo ticket mới.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F06): dựng danh sách ticket, form tạo và nối API-M10-03.
export default function SupportTicketsPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="SupportTicketsPage"
        route="/account/support"
        srsRefs={['M10-F06', 'M10-F07', 'API-M10-03']}
        todos={[
          'Dựng danh sách ticket của khách và form tạo ticket mới.',
          'Bổ sung API danh sách ticket — SRS chỉ có tạo/chi tiết/phản hồi (OPEN_DECISIONS).',
          'Nối API-M10-03; hiển thị mã ticket dạng #TK-XXXXX.',
        ]}
        description="Trung tâm hỗ trợ của khách: tạo và theo dõi yêu cầu hỗ trợ (M10-F06, M10-F07)."
      />
    </div>
  );
}
