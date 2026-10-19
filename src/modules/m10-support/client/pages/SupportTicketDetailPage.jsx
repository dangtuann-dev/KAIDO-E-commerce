/**
 * [TOY-M10] Hỗ trợ và đánh giá — SupportTicketDetailPage
 * SRS: M10 | API/FR: M10-F07, API-M10-04, API-M10-05, BR-M10-05
 * Route: /account/support/[ticketId]
 * Render: Client Component (tương tác) — TODO(M10-F07).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng timeline tin nhắn, trạng thái và form phản hồi.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F07): dựng chi tiết ticket và nối API-M10-04/API-M10-05.
export default function SupportTicketDetailPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="SupportTicketDetailPage"
        route="/account/support/[ticketId]"
        srsRefs={['M10-F07', 'API-M10-04', 'API-M10-05', 'BR-M10-05']}
        todos={[
          'Dựng timeline tin nhắn, trạng thái và form phản hồi.',
          'Nối API-M10-04/API-M10-05; giới hạn 5 ảnh hoặc 1 video ≤ 5MB (BR-M10-05).',
          'Chỉ chủ ticket được xem (NFR-M10-02).',
        ]}
        description="Chi tiết yêu cầu hỗ trợ: hội thoại với CSKH, tệp đính kèm và trạng thái xử lý."
      />
    </div>
  );
}
