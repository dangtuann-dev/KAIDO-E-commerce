'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SortDropdown
 * SRS: M03-F07 | API: API-M03-01
 * Route: /search, /category/[slug]
 * UI: Sắp xếp mặc định, giá tăng/giảm, mới nhất, bán chạy.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F07): Đồng bộ tham số sort với URL và nối lại truy vấn search.
export default function SortDropdown() {
  return (
    <ModuleStub
      moduleCode="TOY-M03"
      moduleName="Tìm kiếm, lọc, sắp xếp"
      componentName="SortDropdown"
      route="/search"
      srsRefs={['M03-F07', 'API-M03-01']}
      todos={[
        'Đồng bộ tham số sort với URL và nối lại truy vấn search.',
        'Nối API-M03-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Sắp xếp mặc định, giá tăng/giảm, mới nhất, bán chạy."
      headingLevel="h2"
    />
  );
}
