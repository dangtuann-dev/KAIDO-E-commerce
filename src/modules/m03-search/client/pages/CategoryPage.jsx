/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — CategoryPage
 * SRS: M03 | API/FR: M03-F03, M02-F01, API-M02-01, API-M03-01
 * Route: /category/[slug]
 * Render: Server Component (SEO/ISR) + Client filters — TODO(M03-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Đọc cây danh mục từ API-M02-01 và hiển thị breadcrumb đa cấp.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F03): dựng trang danh mục theo slug với breadcrumb và bộ lọc.
export default function CategoryPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M03"
        moduleName="Tìm kiếm, lọc, sắp xếp"
        componentName="CategoryPage"
        route="/category/[slug]"
        srsRefs={['M03-F03', 'M02-F01', 'API-M02-01', 'API-M03-01']}
        todos={[
          'Đọc cây danh mục từ API-M02-01 và hiển thị breadcrumb đa cấp.',
          'Dựng listing theo danh mục với bộ lọc M03 và phân trang 12 sản phẩm.',
          'Trả 404 khi slug không hợp lệ; generateMetadata theo danh mục.',
        ]}
        description="Trang danh mục sản phẩm theo slug, kết hợp cây danh mục M02 với bộ lọc tìm kiếm M03."
      />
    </div>
  );
}
