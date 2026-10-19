/**
 * [TOY-M01] Tài khoản và người dùng — SecurityPage
 * SRS: M01 | API/FR: M01-F05, API-M01-06, BR-M01-02
 * Route: /account/security
 * Render: Client Component (tương tác) — TODO(M01-F05): nối luồng OTP.
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng luồng quên mật khẩu: OTP hiệu lực 5 phút, gửi lại tối đa 3 lần/giờ (M01-F05).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F05): dựng form OTP và trạng thái khóa tài khoản theo BR-M01-02.
export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M01"
        moduleName="Tài khoản và người dùng"
        componentName="SecurityPage"
        route="/account/security"
        srsRefs={['M01-F05', 'API-M01-06', 'BR-M01-02']}
        todos={[
          'Dựng luồng quên mật khẩu: OTP hiệu lực 5 phút, gửi lại tối đa 3 lần/giờ (M01-F05).',
          'Hiển thị trạng thái khóa tài khoản sau 5 lần sai, khóa 15 phút (BR-M01-02).',
          'API đổi mật khẩu chưa có trong danh sách SRS — ghi OPEN_DECISIONS trước khi làm.',
        ]}
        description="Trang bảo mật tài khoản: đổi mật khẩu và khôi phục qua OTP. Nghiệp vụ chi tiết thuộc M01-F05 và BR-M01-02."
      />
    </div>
  );
}
