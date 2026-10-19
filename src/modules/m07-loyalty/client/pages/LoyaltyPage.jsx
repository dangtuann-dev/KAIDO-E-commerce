/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — LoyaltyPage
 * SRS: M07 | API/FR: M07-F03, M07-F04, M07-F05, M07-F06, API-M07-02, BR-M07-04
 * Route: /account/loyalty
 * Render: Client Component (tương tác) — TODO(M07-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng MembershipCard: hạng hiện tại, tiến trình lên hạng, quyền lợi.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F03): dựng MembershipCard và nối API-M07-02.
export default function LoyaltyPage() {
  return (
    <div className="space-y-6">
      <ModuleStub
        moduleCode="TOY-M07"
        moduleName="Khuyến mãi và khách thân thiết"
        componentName="LoyaltyPage"
        route="/account/loyalty"
        srsRefs={['M07-F03', 'M07-F04', 'M07-F05', 'M07-F06', 'API-M07-02', 'BR-M07-04']}
        todos={[
          'Dựng MembershipCard: hạng hiện tại, tiến trình lên hạng, quyền lợi.',
          'Hiển thị điểm hiện có, điểm sắp hết hạn và giá trị quy đổi (1 điểm = 1.000đ).',
          'Hạng xét theo chi tiêu 12 tháng gần nhất (BR-M07-04); nối API-M07-02.',
        ]}
        description="Trang khách thân thiết: điểm thưởng, hạng thành viên và đặc quyền tương ứng (M07-F03..F06)."
      />
    </div>
  );
}
