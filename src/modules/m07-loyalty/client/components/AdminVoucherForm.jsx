'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — AdminVoucherForm
 * SRS: M07-F01, M07-F05 | API: API-M07-05, API-M07-06 | BR: BR-M09-02
 * Route: /admin/loyalty/vouchers
 * UI: Form loại giảm giá, điều kiện, thời hạn, lượt dùng; bảng phân bố hạng thành viên.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F01): Dựng RHF + Zod, nối useCreateVoucher/useGetTierSummary; ghi voucher qua CouponService.
export default function AdminVoucherForm() {
  return (
    <ModuleStub
      moduleCode="TOY-M07"
      moduleName="Khuyến mãi và khách thân thiết"
      componentName="AdminVoucherForm"
      route="/admin/loyalty/vouchers"
      srsRefs={['M07-F01', 'M07-F05', 'API-M07-05', 'API-M07-06', 'BR-M09-02']}
      todos={[
        'Dựng RHF + Zod, nối useCreateVoucher/useGetTierSummary; ghi voucher qua CouponService.',
        'Nối API-M07-05, API-M07-06 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Form loại giảm giá, điều kiện, thời hạn, lượt dùng; bảng phân bố hạng thành viên."
      headingLevel="h2"
    />
  );
}
