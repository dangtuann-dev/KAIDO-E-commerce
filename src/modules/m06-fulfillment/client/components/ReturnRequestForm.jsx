'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — ReturnRequestForm
 * SRS: M06-F12, M06-F05 | API: API-M06-06 | BR: BR-M06-05, BR-M10-05
 * Route: /account/orders/[orderRef]/return
 * UI: Chọn sản phẩm, lý do, mô tả và tải tối thiểu 1 ảnh minh chứng trong 7 ngày.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M06-F12): Dựng RHF + Zod, nối useCreateReturnRequest và trạng thái PENDING_APPROVAL.
export default function ReturnRequestForm() {
  return (
    <ModuleStub
      moduleCode="TOY-M06"
      moduleName="Đơn hàng và giao vận"
      componentName="ReturnRequestForm"
      route="/account/orders/[orderRef]/return"
      srsRefs={['M06-F12', 'M06-F05', 'API-M06-06', 'BR-M06-05', 'BR-M10-05']}
      todos={[
        'Dựng RHF + Zod, nối useCreateReturnRequest và trạng thái PENDING_APPROVAL.',
        'Nối API-M06-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Chọn sản phẩm, lý do, mô tả và tải tối thiểu 1 ảnh minh chứng trong 7 ngày."
      headingLevel="h2"
    />
  );
}
