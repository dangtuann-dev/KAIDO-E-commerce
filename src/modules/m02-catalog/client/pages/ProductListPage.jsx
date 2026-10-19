/**
 * [TOY-M02] Sản phẩm và danh mục — ProductListPage
 * SRS: M02 | API/FR: M02-F10, API-M02-02, M03-F08, NFR-M02-01
 * Route: /products
 * Render: Server Component (SEO/ISR) + Client filters — TODO(M02-F10).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng ProductCard và lưới PLP 12 sản phẩm/trang (M03-F08).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F10): dựng PLP 12 sản phẩm/trang và nối API-M02-02.
export default function ProductListPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M02"
        moduleName="Sản phẩm và danh mục"
        componentName="ProductListPage"
        route="/products"
        srsRefs={['M02-F10', 'API-M02-02', 'M03-F08', 'NFR-M02-01']}
        todos={[
          'Dựng ProductCard và lưới PLP 12 sản phẩm/trang (M03-F08).',
          'Nối API-M02-02 qua server fetch/ISR, giữ FCP < 1.5s (SYS-NFR-01).',
          'Thêm bộ lọc/sắp xếp dùng chung với M03, xử lý skeleton và empty state.',
        ]}
        description="Danh sách sản phẩm công khai. Dữ liệu lấy từ M02; bộ lọc nâng cao do M03 cung cấp."
      />
    </div>
  );
}
