'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — NoResult
 * SRS: M03-F10 | API: API-M03-03
 * Route: /search
 * UI: Trạng thái không có kết quả kèm từ khóa phổ biến và gợi ý xóa bộ lọc.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F10): Nối useGetPopularKeywords và CTA quay lại danh mục.
export default function NoResult() {
  return (
    <ModuleStub
      moduleCode="TOY-M03"
      moduleName="Tìm kiếm, lọc, sắp xếp"
      componentName="NoResult"
      route="/search"
      srsRefs={['M03-F10', 'API-M03-03']}
      todos={[
        'Nối useGetPopularKeywords và CTA quay lại danh mục.',
        'Nối API-M03-03 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Trạng thái không có kết quả kèm từ khóa phổ biến và gợi ý xóa bộ lọc."
      headingLevel="h2"
    />
  );
}
