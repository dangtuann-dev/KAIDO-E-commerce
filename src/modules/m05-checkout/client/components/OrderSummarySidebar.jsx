'use client';

/**
 * [TOY-M05] Đặt hàng và thanh toán — OrderSummarySidebar
 * SRS: M05-F05, M05-F06 | API: API-M05-01 | BR: BR-M07-03, BR-M09-03
 * Route: /checkout
 * UI: Tóm tắt item đã chọn, phí ship, voucher, điểm thưởng và tổng thanh toán.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M05-F05): Nối useGetCheckoutSummary; giới hạn tổng giảm không vượt giá trị hàng (BR-M07-03).
export default function OrderSummarySidebar() {
  return (
    <ModuleStub
      moduleCode="TOY-M05"
      moduleName="Đặt hàng và thanh toán"
      componentName="OrderSummarySidebar"
      route="/checkout"
      srsRefs={['M05-F05', 'M05-F06', 'API-M05-01', 'BR-M07-03', 'BR-M09-03']}
      todos={[
        'Nối useGetCheckoutSummary; giới hạn tổng giảm không vượt giá trị hàng (BR-M07-03).',
        'Nối API-M05-01 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Tóm tắt item đã chọn, phí ship, voucher, điểm thưởng và tổng thanh toán."
      headingLevel="h2"
    />
  );
}
