'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — ProductGallery
 * SRS: M02-F11, M02-F07 | API: API-M02-03
 * Route: /products/[slug]
 * UI: Ảnh chính vuông + thumbnail, tối đa 10 ảnh, alt text và zoom nhẹ trên desktop.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F11): Dựng gallery responsive; nối dữ liệu ảnh signed URL từ PDP.
export default function ProductGallery() {
  return (
    <ModuleStub
      moduleCode="TOY-M02"
      moduleName="Sản phẩm và danh mục"
      componentName="ProductGallery"
      route="/products/[slug]"
      srsRefs={['M02-F11', 'M02-F07', 'API-M02-03']}
      todos={[
        'Dựng gallery responsive; nối dữ liệu ảnh signed URL từ PDP.',
        'Nối API-M02-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Ảnh chính vuông + thumbnail, tối đa 10 ảnh, alt text và zoom nhẹ trên desktop."
      headingLevel="h2"
    />
  );
}
