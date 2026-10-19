'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — AdminUserTable
 * SRS: M01-F07 | API: API-M01-07 | BR: BR-M01-05
 * Route: /admin/users
 * UI: Bảng người dùng có lọc vai trò, trạng thái hoạt động và phân trang.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F07): Nối useListAdminUsers; bổ sung API khóa/mở khóa và chặn thao tác với ADMIN (BR-M01-05).
export default function AdminUserTable() {
  return (
    <ModuleStub
      moduleCode="TOY-M01"
      moduleName="Tài khoản và người dùng"
      componentName="AdminUserTable"
      route="/admin/users"
      srsRefs={['M01-F07', 'API-M01-07', 'BR-M01-05']}
      todos={[
        'Nối useListAdminUsers; bổ sung API khóa/mở khóa và chặn thao tác với ADMIN (BR-M01-05).',
        'Nối API-M01-07 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Bảng người dùng có lọc vai trò, trạng thái hoạt động và phân trang."
      headingLevel="h2"
    />
  );
}
