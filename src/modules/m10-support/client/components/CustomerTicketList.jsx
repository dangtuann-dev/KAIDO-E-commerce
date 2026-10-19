'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — CustomerTicketList
 * SRS: M10-F06, M10-F07 | API: API-M10-03, API-M10-04
 * Route: /account/support
 * UI: Danh sách ticket của khách kèm trạng thái, ưu tiên, cập nhật gần nhất.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F06): Bổ sung API danh sách ticket (OPEN_DECISIONS) và nối useCreateSupportTicket.
export default function CustomerTicketList() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="CustomerTicketList"
      route="/account/support"
      srsRefs={['M10-F06', 'M10-F07', 'API-M10-03', 'API-M10-04']}
      todos={[
        'Bổ sung API danh sách ticket (OPEN_DECISIONS) và nối useCreateSupportTicket.',
        'Nối API-M10-03, API-M10-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Danh sách ticket của khách kèm trạng thái, ưu tiên, cập nhật gần nhất."
      headingLevel="h2"
    />
  );
}
