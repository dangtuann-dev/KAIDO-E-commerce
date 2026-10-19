/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminBannersPage
 * SRS: M09 | API/FR: M09-F01, M09-F05, API-M09-01, API-M09-04, BR-M09-04
 * Route: /admin/marketing/banners
 * Render: Client Component (tương tác) — TODO(M09-F01).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng form banner: vị trí, thứ tự, thời gian hiển thị, ảnh responsive.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F01): dựng form banner và nối API-M09-04.
export default function AdminBannersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M09"
        moduleName="Nội dung và chiến dịch quảng bá"
        componentName="AdminBannersPage"
        route="/admin/marketing/banners"
        srsRefs={['M09-F01', 'M09-F05', 'API-M09-01', 'API-M09-04', 'BR-M09-04']}
        todos={[
          'Dựng form banner: vị trí, thứ tự, thời gian hiển thị, ảnh responsive.',
          'Giới hạn ảnh ≤ 2MB, WebP/PNG; tối đa 5 banner lớn trang chủ (BR-M09-04).',
          'Nối API-M09-04; bật/tắt và lên lịch tự động (M09-F05).',
        ]}
        description="Quản trị banner quảng cáo theo vị trí và lịch hiển thị (M09-F01, M09-F05)."
      />
    </div>
  );
}
