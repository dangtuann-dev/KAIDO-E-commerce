/**
 * [TOY-M01] Tài khoản và người dùng — ProfilePage
 * SRS: M01 | API/FR: M01-F03, API-M01-03, API-M01-04, BR-M01-01
 * Route: /account/profile
 * Render: Client Component (tương tác) — TODO(M01-F03): nối hook TanStack Query.
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng form hồ sơ bằng React Hook Form + Zod, hiển thị lỗi theo trường.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F03): dựng form hồ sơ RHF + Zod và nối API-M01-03/API-M01-04.
export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M01"
        moduleName="Tài khoản và người dùng"
        componentName="ProfilePage"
        route="/account/profile"
        srsRefs={['M01-F03', 'API-M01-03', 'API-M01-04', 'BR-M01-01']}
        todos={[
          'Dựng form hồ sơ bằng React Hook Form + Zod, hiển thị lỗi theo trường.',
          'Nối API-M01-03/API-M01-04 và đồng bộ user vào auth store.',
          'Avatar tải qua signed upload URL của Supabase Storage (M02-F07 dùng chung).',
        ]}
        description="Trang quản lý hồ sơ cá nhân: họ tên, SĐT, ngày sinh của bé và ảnh đại diện. Cần đăng nhập (M01-F03)."
      />
    </div>
  );
}
