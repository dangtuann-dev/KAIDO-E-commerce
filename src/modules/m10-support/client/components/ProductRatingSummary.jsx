'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — ProductRatingSummary
 * SRS: M10-F03 | API: API-M10-01 | BR: BR-M10-03
 * Route: /products/[slug]
 * UI: Điểm trung bình, tổng lượt đánh giá và phân bố số sao.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F03): Nối useListProductReviews; đồng bộ rating_avg sang M02 sau kiểm duyệt.
export default function ProductRatingSummary() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="ProductRatingSummary"
      route="/products/[slug]"
      srsRefs={['M10-F03', 'API-M10-01', 'BR-M10-03']}
      todos={[
        'Nối useListProductReviews; đồng bộ rating_avg sang M02 sau kiểm duyệt.',
        'Nối API-M10-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Điểm trung bình, tổng lượt đánh giá và phân bố số sao."
      headingLevel="h2"
    />
  );
}
