/**
 * [TOY-M10] Hỗ trợ và đánh giá — AdminReviewsPage
 * SRS: M10 | API/FR: M10-F04, API-M10-07, BR-M10-03
 * Route: /admin/reviews
 * Render: Client Component (tương tác) — TODO(M10-F04).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng đánh giá chờ duyệt, lọc theo trạng thái và sản phẩm.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F04): dựng bảng kiểm duyệt review và nối API-M10-07.
export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="AdminReviewsPage"
        route="/admin/reviews"
        srsRefs={['M10-F04', 'API-M10-07', 'BR-M10-03']}
        todos={[
          'Dựng bảng đánh giá chờ duyệt, lọc theo trạng thái và sản phẩm.',
          'Duyệt/từ chối/ẩn kèm lý do; đồng bộ rating sang M02 qua public.server.js.',
          'Nối API-M10-07; giới hạn nội dung 10–1000 ký tự (M10-F01).',
        ]}
        description="Kiểm duyệt đánh giá sản phẩm trước khi hiển thị công khai. Quyền STAFF/ADMIN."
      />
    </div>
  );
}
