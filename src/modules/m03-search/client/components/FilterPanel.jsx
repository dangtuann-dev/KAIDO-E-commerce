'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — FilterPanel
 * SRS: M03-F03, M03-F04, M03-F05, M03-F06, M03-F09 | API: API-M03-01
 * Route: /search, /category/[slug]
 * UI: Facet danh mục, thương hiệu, khoảng giá, độ tuổi, giới tính, tình trạng; nút xóa bộ lọc.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F03): Nối facets từ useSearchProducts; đồng bộ bộ lọc với URL để chia sẻ được.
export default function FilterPanel() {
  return (
    <ModuleStub
      moduleCode="TOY-M03"
      moduleName="Tìm kiếm, lọc, sắp xếp"
      componentName="FilterPanel"
      route="/search"
      srsRefs={['M03-F03', 'M03-F04', 'M03-F05', 'M03-F06', 'M03-F09', 'API-M03-01']}
      todos={[
        'Nối facets từ useSearchProducts; đồng bộ bộ lọc với URL để chia sẻ được.',
        'Nối API-M03-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Facet danh mục, thương hiệu, khoảng giá, độ tuổi, giới tính, tình trạng; nút xóa bộ lọc."
      headingLevel="h2"
    />
  );
}
