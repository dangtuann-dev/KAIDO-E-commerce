'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — ProductGrid
 * SRS: M03-F08, M02-F10 | API: API-M03-01
 * Route: /search, /category/[slug]
 * UI: Lưới sản phẩm responsive, 12 sản phẩm/trang, skeleton khi tải.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F08): Dùng ProductCard từ m02-catalog/public.client.js và hiển thị trạng thái rỗng.
export default function ProductGrid() {
  return (
    <ModuleStub
      moduleCode="TOY-M03"
      moduleName="Tìm kiếm, lọc, sắp xếp"
      componentName="ProductGrid"
      route="/search"
      srsRefs={['M03-F08', 'M02-F10', 'API-M03-01']}
      todos={[
        'Dùng ProductCard từ m02-catalog/public.client.js và hiển thị trạng thái rỗng.',
        'Nối API-M03-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Lưới sản phẩm responsive, 12 sản phẩm/trang, skeleton khi tải."
      headingLevel="h2"
    />
  );
}
