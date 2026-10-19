'use client';

/**
 * [TOY-M01] Tài khoản và người dùng — UserProfileCard
 * SRS: M01-F03 | API: API-M01-03, API-M01-04 | BR: BR-M01-01
 * Route: /account/profile
 * UI: Thẻ hồ sơ có avatar, họ tên, SĐT, ngày sinh của bé; có trạng thái tải và lỗi.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M01-F03): Dựng form RHF + Zod, nối useGetProfile/useUpdateProfile và đồng bộ auth store.
export default function UserProfileCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M01"
      moduleName="Tài khoản và người dùng"
      componentName="UserProfileCard"
      route="/account/profile"
      srsRefs={['M01-F03', 'API-M01-03', 'API-M01-04', 'BR-M01-01']}
      todos={[
        'Dựng form RHF + Zod, nối useGetProfile/useUpdateProfile và đồng bộ auth store.',
        'Nối API-M01-03, API-M01-04 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Thẻ hồ sơ có avatar, họ tên, SĐT, ngày sinh của bé; có trạng thái tải và lỗi."
      headingLevel="h2"
    />
  );
}
