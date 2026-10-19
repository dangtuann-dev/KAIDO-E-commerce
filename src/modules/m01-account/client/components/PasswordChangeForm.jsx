'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — PasswordChangeForm
 * SRS: M01-F05 | API: API-M01-06 | BR: BR-M01-02
 * Route: /account/security
 * UI: Luồng OTP hiệu lực 5 phút, gửi lại tối đa 3 lần/giờ; hiển thị trạng thái khóa tài khoản.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F05): Dựng luồng OTP, thêm API đổi mật khẩu còn thiếu và nối useForgotPassword.
export default function PasswordChangeForm() {
  return (
    <ModuleStub
      moduleCode="TOY-M01"
      moduleName="Tài khoản và người dùng"
      componentName="PasswordChangeForm"
      route="/account/security"
      srsRefs={['M01-F05', 'API-M01-06', 'BR-M01-02']}
      todos={[
        'Dựng luồng OTP, thêm API đổi mật khẩu còn thiếu và nối useForgotPassword.',
        'Nối API-M01-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Luồng OTP hiệu lực 5 phút, gửi lại tối đa 3 lần/giờ; hiển thị trạng thái khóa tài khoản."
      headingLevel="h2"
    />
  );
}
