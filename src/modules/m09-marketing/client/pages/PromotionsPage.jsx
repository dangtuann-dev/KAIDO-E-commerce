/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — PromotionsPage
 * SRS: M09 | API/FR: M09-F03, M09-F04, M09-F07, API-M09-02, API-M09-03
 * Route: /promotions
 * Render: Server Component (SEO) — TODO(M09-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Hiển thị chiến dịch đang chạy và banner theo lịch (API-M09-02).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F03): dựng trang khuyến mãi và nối API-M09-02.
export default function PromotionsPage() {
  return (
    <div className="kaido-container py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M09"
        moduleName="Nội dung và chiến dịch quảng bá"
        componentName="PromotionsPage"
        route="/promotions"
        srsRefs={['M09-F03', 'M09-F04', 'M09-F07', 'API-M09-02', 'API-M09-03']}
        todos={[
          'Hiển thị chiến dịch đang chạy và banner theo lịch (API-M09-02).',
          'Liệt kê voucher công khai; xác thực mã qua API-M09-03/CouponService.',
          'Xử lý trạng thái hết hạn/ngừng hiển thị theo BR-M09-01.',
        ]}
        description="Trang tổng hợp khuyến mãi và chiến dịch đang chạy. Dữ liệu thuộc M09."
      />
    </div>
  );
}
