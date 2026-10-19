/**
 * [TOY-M02] Sản phẩm và danh mục — AdminProductListPage
 * SRS: M02 | API/FR: M02-F05, M02-F06, M02-F08, API-M02-04, API-M02-05, API-M02-06, BR-M02-01
 * Route: /admin/products
 * Render: Client Component (tương tác) — TODO(M02-F05/F06/F08).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng sản phẩm: trạng thái, giá, tồn kho, thao tác sửa/xóa mềm.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M02-F05): dựng bảng sản phẩm admin và nối API-M02-05/API-M02-06.
export default function AdminProductListPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M02"
        moduleName="Sản phẩm và danh mục"
        componentName="AdminProductListPage"
        route="/admin/products"
        srsRefs={[
          'M02-F05',
          'M02-F06',
          'M02-F08',
          'API-M02-04',
          'API-M02-05',
          'API-M02-06',
          'BR-M02-01',
        ]}
        todos={[
          'Dựng bảng sản phẩm: trạng thái, giá, tồn kho, thao tác sửa/xóa mềm.',
          'Nối API-M02-05 và API-M02-06; xác nhận trước khi xóa mềm (M02-F06).',
          'Hiển thị cảnh báo SKU trùng và sản phẩm sắp hết hàng (M02-F13).',
        ]}
        description="Danh sách sản phẩm trong back-office, hỗ trợ cập nhật, ẩn/ngừng kinh doanh và xóa mềm."
      />
    </div>
  );
}
