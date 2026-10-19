/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSuccessPage
 * SRS: M05 | API/FR: M05-F08, API-M05-03, M05-F07
 * Route: /order-success/[code]
 * Render: Client Component (poll trạng thái) — TODO(M05-F08).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Hiển thị mã đơn, tổng tiền, phương thức thanh toán và thời gian giao dự kiến.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F08): dựng trang xác nhận đơn và nối API-M05-03.
export default function OrderSuccessPage() {
  return (
    <div className="kaido-container max-w-5xl py-8 md:py-10">
      <ModuleStub
        moduleCode="TOY-M05"
        moduleName="Đặt hàng và thanh toán"
        componentName="OrderSuccessPage"
        route="/order-success/[code]"
        srsRefs={['M05-F08', 'API-M05-03', 'M05-F07']}
        todos={[
          'Hiển thị mã đơn, tổng tiền, phương thức thanh toán và thời gian giao dự kiến.',
          'Poll trạng thái thanh toán online; hướng dẫn khi timeout (BR-M05-02).',
          'CTA theo dõi đơn (M06) và tiếp tục mua sắm.',
        ]}
        description="Trang xác nhận sau đặt hàng; dùng order code trên URL để tra cứu đơn của chủ đơn."
      />
    </div>
  );
}
