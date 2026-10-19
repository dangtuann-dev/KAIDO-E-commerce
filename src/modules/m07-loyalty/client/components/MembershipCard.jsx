'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — MembershipCard
 * SRS: M07-F03, M07-F05, M07-F06 | API: API-M07-02 | BR: BR-M07-04
 * Route: /account/loyalty
 * UI: Hạng hiện tại, tiến trình lên hạng, quyền lợi và điểm sắp hết hạn.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F03): Nối useGetMyPoints; hạng xét theo chi tiêu 12 tháng gần nhất (BR-M07-04).
export default function MembershipCard() {
  return (
    <ModuleStub
      moduleCode="TOY-M07"
      moduleName="Khuyến mãi và khách thân thiết"
      componentName="MembershipCard"
      route="/account/loyalty"
      srsRefs={['M07-F03', 'M07-F05', 'M07-F06', 'API-M07-02', 'BR-M07-04']}
      todos={[
        'Nối useGetMyPoints; hạng xét theo chi tiêu 12 tháng gần nhất (BR-M07-04).',
        'Nối API-M07-02 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Hạng hiện tại, tiến trình lên hạng, quyền lợi và điểm sắp hết hạn."
      headingLevel="h2"
    />
  );
}
