/**
 * [TOY-M10] Hỗ trợ và đánh giá — FaqPage
 * SRS: M10 | API/FR: M10-F10, API-M10-06, SYS-NFR-01
 * Route: /faq
 * Render: Server Component (SEO) — TODO(M10-F10).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng FAQ accordion theo 4 nhóm đã seed (Giao hàng, Đổi trả, Thanh toán, Bảo hành).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M10-F10): dựng FAQ accordion, JSON-LD FAQPage và nối API-M10-06.
export default function FaqPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M10"
        moduleName="Hỗ trợ và đánh giá"
        componentName="FaqPage"
        route="/faq"
        srsRefs={['M10-F10', 'API-M10-06', 'SYS-NFR-01']}
        todos={[
          'Dựng FAQ accordion theo 4 nhóm đã seed (Giao hàng, Đổi trả, Thanh toán, Bảo hành).',
          'Nối API-M10-06 và thêm JSON-LD FAQPage.',
          'Bổ sung tìm kiếm FAQ; API admin quản lý FAQ chưa có trong SRS.',
        ]}
        description="Trang câu hỏi thường gặp công khai. Dữ liệu do M10 quản lý, hỗ trợ SEO bằng FAQPage schema."
      />
    </div>
  );
}
