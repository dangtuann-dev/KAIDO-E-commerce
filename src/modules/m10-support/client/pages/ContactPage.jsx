/**
 * [TOY-M10] Hỗ trợ và đánh giá — ContactPage
 * SRS: M10 | API/FR: M10-F06, API-M10-03
 * Route: /contact
 * Render: Server Component (SEO) — TODO(M10-F06).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Chỉ dựng page khung theo OPEN_DECISIONS #15 — SRS không có FR liên hệ riêng.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F06): chốt hướng xử lý trang liên hệ và nối ticket nếu được duyệt.
export default function ContactPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="ContactPage"
        route="/contact"
        srsRefs={['M10-F06', 'API-M10-03']}
        todos={[
          'Chỉ dựng page khung theo OPEN_DECISIONS #15 — SRS không có FR liên hệ riêng.',
          'Nếu chốt, form liên hệ có thể tạo support ticket qua API-M10-03.',
          'Bổ sung thông tin liên hệ chính thức khi KAIDO cung cấp.',
        ]}
        description="Trang liên hệ. SRS không có chức năng riêng; hiện là page khung và có thể nối với ticket hỗ trợ."
      />
    </div>
  );
}
