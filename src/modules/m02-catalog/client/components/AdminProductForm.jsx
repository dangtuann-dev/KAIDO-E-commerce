'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductForm
 * SRS: M02-F04, M02-F05, M02-F07, M02-F08 | API: API-M02-04, API-M02-05 | BR: BR-M02-01, BR-M02-03
 * Route: /admin/products/create, /admin/products
 * UI: Form thông tin, giá, danh mục, thương hiệu, độ tuổi, biến thể; upload tối đa 10 ảnh 800x800.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F04): Dựng RHF + Zod dùng chung validation server; kiểm tra SKU duy nhất và price_sale <= price_regular.
export default function AdminProductForm() {
  return (
    <ModuleStub
      moduleCode="TOY-M02"
      moduleName="Sản phẩm và danh mục"
      componentName="AdminProductForm"
      route="/admin/products/create"
      srsRefs={[
        'M02-F04',
        'M02-F05',
        'M02-F07',
        'M02-F08',
        'API-M02-04',
        'API-M02-05',
        'BR-M02-01',
        'BR-M02-03',
      ]}
      todos={[
        'Dựng RHF + Zod dùng chung validation server; kiểm tra SKU duy nhất và price_sale <= price_regular.',
        'Nối API-M02-04, API-M02-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Form thông tin, giá, danh mục, thương hiệu, độ tuổi, biến thể; upload tối đa 10 ảnh 800x800."
      headingLevel="h2"
    />
  );
}
