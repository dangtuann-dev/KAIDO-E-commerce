/**
 * [TOY-M02] Sản phẩm và danh mục — ProductDetailPage
 * SRS: M02 | API/FR: M02-F11, API-M02-03, M10-F03, API-M10-01, NFR-M02-01
 * Route: /products/[slug]
 * Render: Server Component (SEO/ISR) — TODO(M02-F11).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng PDP: gallery, biến thể, tồn kho, sản phẩm liên quan, đánh giá.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F11): dựng PDP, JSON-LD Product/Breadcrumb và nối API-M02-03.
export default function ProductDetailPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M02"
        moduleName="Sản phẩm và danh mục"
        componentName="ProductDetailPage"
        route="/products/[slug]"
        srsRefs={['M02-F11', 'API-M02-03', 'M10-F03', 'API-M10-01', 'NFR-M02-01']}
        todos={[
          'Dựng PDP: gallery, biến thể, tồn kho, sản phẩm liên quan, đánh giá.',
          'Nối API-M02-03 và API-M10-01 qua server; thêm JSON-LD Product + BreadcrumbList.',
          'Xử lý slug không tồn tại và generateMetadata theo dữ liệu thật.',
        ]}
        description="Trang chi tiết sản phẩm theo slug. Cần SEO đầy đủ và là nơi bắt đầu luồng thêm vào giỏ (M04)."
      />
    </div>
  );
}
