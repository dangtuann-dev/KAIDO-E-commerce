'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SearchKeywordStats
 * SRS: M03-F12 | API: API-M03-03, API-M03-04
 * Route: /admin/analytics/search
 * UI: Bảng top từ khóa, từ khóa không có kết quả, tổng lượt tìm theo khoảng ngày.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F12): Dựng bảng thống kê và nối useGetSearchStatistics/useGetPopularKeywords.
export default function SearchKeywordStats() {
  return (
    <ModuleStub
      moduleCode="TOY-M03"
      moduleName="Tìm kiếm, lọc, sắp xếp"
      componentName="SearchKeywordStats"
      route="/admin/analytics/search"
      srsRefs={['M03-F12', 'API-M03-03', 'API-M03-04']}
      todos={[
        'Dựng bảng thống kê và nối useGetSearchStatistics/useGetPopularKeywords.',
        'Nối API-M03-03, API-M03-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng top từ khóa, từ khóa không có kết quả, tổng lượt tìm theo khoảng ngày."
      headingLevel="h2"
    />
  );
}
