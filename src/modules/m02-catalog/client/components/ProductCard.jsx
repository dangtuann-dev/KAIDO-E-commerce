'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — ProductCard
 * SRS: M02-F10, M02-F11, M02-F08 | API: API-M02-02, API-M02-03 | BR: BR-M02-03, BR-M02-05
 * Route: /products, /category/[slug], /search, /
 * UI: Ảnh 1:1, tên, giá niêm yết/sale gạch ngang, nhãn hết hàng và nút thêm giỏ.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F10): Dựng card theo Blueprint §3.3 và nối useListProducts; xử lý ảnh lazy-load.
export default function ProductCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M02"
      moduleName="Sản phẩm và danh mục"
      componentName="ProductCard"
      route="/products"
      srsRefs={[
        'M02-F10',
        'M02-F11',
        'M02-F08',
        'API-M02-02',
        'API-M02-03',
        'BR-M02-03',
        'BR-M02-05',
      ]}
      todos={[
        'Dựng card theo Blueprint §3.3 và nối useListProducts; xử lý ảnh lazy-load.',
        'Nối API-M02-02, API-M02-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Ảnh 1:1, tên, giá niêm yết/sale gạch ngang, nhãn hết hàng và nút thêm giỏ."
      headingLevel="h2"
    />
  );
}
