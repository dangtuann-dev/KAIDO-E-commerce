'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — TicketChatBox
 * SRS: M10-F07 | API: API-M10-04, API-M10-05 | BR: BR-M10-04, BR-M10-05
 * Route: /account/support/[ticketId], /admin/support
 * UI: Hội thoại dạng chat với CSKH, đính kèm, trạng thái đã đọc và form trả lời.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F07): Nối useGetSupportTicket/useReplySupportTicket; giới hạn tệp BR-M10-05.
export default function TicketChatBox() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="TicketChatBox"
      route="/account/support/[ticketId]"
      srsRefs={['M10-F07', 'API-M10-04', 'API-M10-05', 'BR-M10-04', 'BR-M10-05']}
      todos={[
        'Nối useGetSupportTicket/useReplySupportTicket; giới hạn tệp BR-M10-05.',
        'Nối API-M10-04, API-M10-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Hội thoại dạng chat với CSKH, đính kèm, trạng thái đã đọc và form trả lời."
      headingLevel="h2"
    />
  );
}
