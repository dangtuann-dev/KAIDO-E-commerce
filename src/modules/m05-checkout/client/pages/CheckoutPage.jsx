/**
 * [TOY-M05] Đặt hàng và thanh toán — CheckoutPage
 * SRS: M05 | API/FR: M05-F01, M05-F06, API-M05-01, API-M05-02, BR-M05-01, BR-M05-02
 * Route: /checkout
 * Render: Client Component (tương tác) — TODO(M05-F06).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng form giao hàng (2 cấp Tỉnh → Xã), chọn vận chuyển và thanh toán.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F06): dựng form checkout, tính tổng và nối API-M05-02.
export default function CheckoutPage() {
  return (
    <div className="kaido-container max-w-5xl py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M05"
        moduleName="Đặt hàng và thanh toán"
        componentName="CheckoutPage"
        route="/checkout"
        srsRefs={['M05-F01', 'M05-F06', 'API-M05-01', 'API-M05-02', 'BR-M05-01', 'BR-M05-02']}
        todos={[
          'Dựng form giao hàng (2 cấp Tỉnh → Xã), chọn vận chuyển và thanh toán.',
          'Chỉ COD, VNPAY, MoMo, ZaloPay; không thu thập thẻ tín dụng (SYS-NFR-04).',
          'Nối API-M05-01/02; timeout thanh toán online 20 phút (BR-M05-02).',
        ]}
        description="Luồng checkout: địa chỉ, phương thức vận chuyển, voucher/điểm và đặt hàng với giữ tồn nguyên tử."
      />
    </div>
  );
}
