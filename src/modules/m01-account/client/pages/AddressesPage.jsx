/**
 * [TOY-M01] Tài khoản và người dùng — AddressesPage
 * SRS: M01 | API/FR: M01-F04, API-M01-05, BR-M01-04
 * Route: /account/addresses
 * Render: Client Component (tương tác) — TODO(M01-F04): nối API-M01-05.
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Hiển thị tối đa 10 địa chỉ và đúng một địa chỉ mặc định (BR-M01-04).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F04): dựng sổ địa chỉ, kiểm tra giới hạn 10 và địa chỉ mặc định.
export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M01"
        moduleName="Tài khoản và người dùng"
        componentName="AddressesPage"
        route="/account/addresses"
        srsRefs={['M01-F04', 'API-M01-05', 'BR-M01-04']}
        todos={[
          'Hiển thị tối đa 10 địa chỉ và đúng một địa chỉ mặc định (BR-M01-04).',
          'Bổ sung API thêm/sửa/xóa/đặt mặc định — SRS chỉ liệt kê API danh sách (OPEN_DECISIONS).',
          'Địa chỉ lưu dạng code + name hai cấp, chờ chốt nguồn dữ liệu ĐVVC (OPEN_DECISIONS #12).',
        ]}
        description="Sổ địa chỉ nhận hàng của khách. SRS M01-F04 quy định giới hạn 10 địa chỉ và luôn có một địa chỉ mặc định."
      />
    </div>
  );
}
