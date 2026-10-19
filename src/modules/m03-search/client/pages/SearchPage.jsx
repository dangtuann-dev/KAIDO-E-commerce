/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SearchPage
 * SRS: M03 | API/FR: M03-F01, M03-F02, M03-F10, API-M03-01, API-M03-02
 * Route: /search
 * Render: Server Component (SEO) + Client filters — TODO(M03-F01).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng trang kết quả với facet danh mục, thương hiệu, giá, độ tuổi, tồn kho.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M03-F01): dựng faceted search, autocomplete debounce 300ms và nối API-M03-01.
export default function SearchPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M03"
        moduleName="Tìm kiếm, lọc, sắp xếp"
        componentName="SearchPage"
        route="/search"
        srsRefs={['M03-F01', 'M03-F02', 'M03-F10', 'API-M03-01', 'API-M03-02']}
        todos={[
          'Dựng trang kết quả với facet danh mục, thương hiệu, giá, độ tuổi, tồn kho.',
          'Autocomplete từ 2 ký tự, tối đa 8 gợi ý, debounce 300ms (M03-F02).',
          'Xử lý không có kết quả bằng từ khóa phổ biến (API-M03-03, M03-F10).',
        ]}
        description="Trang tìm kiếm faceted search. M03 chỉ đọc dữ liệu M02 và ghi lịch sử tìm kiếm của chính mình."
      />
    </div>
  );
}
