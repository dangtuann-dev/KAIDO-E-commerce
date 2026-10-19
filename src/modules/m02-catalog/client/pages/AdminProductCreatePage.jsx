/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductCreatePage
 * SRS: M02 | API/FR: M02-F04, M02-F07, API-M02-04, BR-M02-01
 * Route: /admin/products/create
 * Render: Client Component (tương tác) — TODO(M02-F04).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng form sản phẩm: thông tin, giá, danh mục, thương hiệu, độ tuổi, biến thể.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F04): dựng form tạo sản phẩm, upload signed URL và nối API-M02-04.
export default function AdminProductCreatePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M02"
        moduleName="Sản phẩm và danh mục"
        componentName="AdminProductCreatePage"
        route="/admin/products/create"
        srsRefs={['M02-F04', 'M02-F07', 'API-M02-04', 'BR-M02-01']}
        todos={[
          'Dựng form sản phẩm: thông tin, giá, danh mục, thương hiệu, độ tuổi, biến thể.',
          'Upload tối đa 10 ảnh qua signed URL, nén 800x800 (M02-F07).',
          'Kiểm tra SKU duy nhất toàn hệ thống (BR-M02-01) và price_sale <= price_regular.',
        ]}
        description="Form tạo sản phẩm mới trong back-office. Validation Zod đã có ở server; client dùng cùng quy tắc."
      />
    </div>
  );
}
