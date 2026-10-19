'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqAccordion
 * SRS: M10-F09, M10-F10 | API: API-M10-06
 * Route: /faq
 * UI: Accordion FAQ theo nhóm, tìm kiếm từ khóa, mở nhiều mục hoặc một mục.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F09): Nối useListFaqs; API admin quản lý FAQ còn thiếu (M10-F09).
export default function FaqAccordion() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="FaqAccordion"
      route="/faq"
      srsRefs={['M10-F09', 'M10-F10', 'API-M10-06']}
      todos={[
        'Nối useListFaqs; API admin quản lý FAQ còn thiếu (M10-F09).',
        'Nối API-M10-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Accordion FAQ theo nhóm, tìm kiếm từ khóa, mở nhiều mục hoặc một mục."
      headingLevel="h2"
    />
  );
}
