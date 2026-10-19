'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — ReviewSubmissionModal
 * SRS: M10-F01 | API: API-M10-02 | BR: BR-M10-01, BR-M10-05
 * Route: /products/[slug]
 * UI: Modal chọn sao, nội dung 10–1000 ký tự, tối đa 5 ảnh hoặc 1 video <= 5MB.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F01): Chỉ mở khi Verified Purchase; dựng RHF + Zod và nối useCreateReview.
export default function ReviewSubmissionModal() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="ReviewSubmissionModal"
      route="/products/[slug]"
      srsRefs={['M10-F01', 'API-M10-02', 'BR-M10-01', 'BR-M10-05']}
      todos={[
        'Chỉ mở khi Verified Purchase; dựng RHF + Zod và nối useCreateReview.',
        'Nối API-M10-02 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Modal chọn sao, nội dung 10–1000 ký tự, tối đa 5 ảnh hoặc 1 video <= 5MB."
      headingLevel="h2"
    />
  );
}
