'use client';

/**
 * [TOY-M10] Hỗ trợ và đánh giá — StoreReplyBox
 * SRS: M10-F05, M10-F08 | API: API-M10-04, API-M10-05 | BR: BR-M10-04
 * Route: /admin/support, /admin/reviews
 * UI: Ô phản hồi của cửa hàng cho review/ticket; chèn mẫu trả lời nhanh.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F05): API phản hồi review còn thiếu (M10-F05); nối reply ticket và tự đóng sau 72 giờ (BR-M10-04).
export default function StoreReplyBox() {
  return (
    <ModuleStub
      moduleCode="TOY-M10"
      moduleName="Hỗ trợ và đánh giá"
      componentName="StoreReplyBox"
      route="/admin/support"
      srsRefs={['M10-F05', 'M10-F08', 'API-M10-04', 'API-M10-05', 'BR-M10-04']}
      todos={[
        'API phản hồi review còn thiếu (M10-F05); nối reply ticket và tự đóng sau 72 giờ (BR-M10-04).',
        'Nối API-M10-04, API-M10-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Ô phản hồi của cửa hàng cho review/ticket; chèn mẫu trả lời nhanh."
      headingLevel="h2"
    />
  );
}
