/**
 * [TOY-M01] Tài khoản và người dùng — AdminUsersPage
 * SRS: M01 | API/FR: M01-F07, API-M01-07, BR-M01-05
 * Route: /admin/users
 * Render: Client Component (tương tác) — TODO(M01-F07): nối API-M01-07.
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng bảng người dùng có lọc theo vai trò và phân trang.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F07): dựng bảng người dùng có lọc vai trò và nối API-M01-07.
export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M01"
        moduleName="Tài khoản và người dùng"
        componentName="AdminUsersPage"
        route="/admin/users"
        srsRefs={['M01-F07', 'API-M01-07', 'BR-M01-05']}
        todos={[
          'Dựng bảng người dùng có lọc theo vai trò và phân trang.',
          'Nối API-M01-07; khóa/mở khóa tài khoản cần API bổ sung (SRS chưa liệt kê).',
          'Chặn thao tác với ADMIN và tài khoản của chính mình theo BR-M01-05.',
        ]}
        description="Danh sách tài khoản dành cho quản trị viên: lọc theo vai trò, theo dõi trạng thái hoạt động (M01-F07)."
      />
    </div>
  );
}
