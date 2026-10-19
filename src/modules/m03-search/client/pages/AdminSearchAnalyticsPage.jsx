/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — AdminSearchAnalyticsPage
 * SRS: M03 | API/FR: M03-F12, API-M03-04, API-M03-03
 * Route: /admin/analytics/search
 * Render: Client Component (biểu đồ) — TODO(M03-F12).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bộ lọc khoảng ngày và bảng top từ khóa.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F12): dựng bảng thống kê tìm kiếm và nối API-M03-04.
export default function AdminSearchAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M03"
        moduleName="Tìm kiếm, lọc, sắp xếp"
        componentName="AdminSearchAnalyticsPage"
        route="/admin/analytics/search"
        srsRefs={['M03-F12', 'API-M03-04', 'API-M03-03']}
        todos={[
          'Dựng bộ lọc khoảng ngày và bảng top từ khóa.',
          'Hiển thị từ khóa không có kết quả và tổng lượt tìm (API-M03-04).',
          'Chỉ ADMIN/MARKETING được xem (ma trận RBAC SRS §2.2).',
        ]}
        description="Bảng thống kê tìm kiếm dành cho quản trị và marketing: top từ khóa, từ khóa không có kết quả."
      />
    </div>
  );
}
