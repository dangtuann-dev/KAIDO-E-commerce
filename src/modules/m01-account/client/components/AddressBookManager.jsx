'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — AddressBookManager
 * SRS: M01-F04 | API: API-M01-05 | BR: BR-M01-04
 * Route: /account/addresses, /checkout
 * UI: Sổ địa chỉ tối đa 10 địa chỉ, đúng một địa chỉ mặc định; form địa chỉ 3 cấp Tỉnh → Huyện → Xã.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F04): Bổ sung API CRUD địa chỉ còn thiếu (OPEN_DECISIONS) và nối useListAddresses.
export default function AddressBookManager() {
  return (
    <ModuleStub
      moduleCode="TOY-M01"
      moduleName="Tài khoản và người dùng"
      componentName="AddressBookManager"
      route="/account/addresses"
      srsRefs={['M01-F04', 'API-M01-05', 'BR-M01-04']}
      todos={[
        'Bổ sung API CRUD địa chỉ còn thiếu (OPEN_DECISIONS) và nối useListAddresses.',
        'Nối API-M01-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Sổ địa chỉ tối đa 10 địa chỉ, đúng một địa chỉ mặc định; form địa chỉ 3 cấp Tỉnh → Huyện → Xã."
      headingLevel="h2"
    />
  );
}
