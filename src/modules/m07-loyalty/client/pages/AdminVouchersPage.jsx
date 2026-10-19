/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — AdminVouchersPage
 * SRS: M07 | API/FR: M07-F01, M07-F05, API-M07-05, API-M07-06, BR-M09-02
 * Route: /admin/loyalty/vouchers
 * Render: Client Component (tương tác) — TODO(M07-F01).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng AdminVoucherForm với loại giảm giá, điều kiện, thời hạn, lượt dùng.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M07-F01): dựng form voucher và gọi CouponService/API-M07-05.
export default function AdminVouchersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M07"
        moduleName="Khuyến mãi và khách thân thiết"
        componentName="AdminVouchersPage"
        route="/admin/loyalty/vouchers"
        srsRefs={['M07-F01', 'M07-F05', 'API-M07-05', 'API-M07-06', 'BR-M09-02']}
        todos={[
          'Dựng AdminVoucherForm với loại giảm giá, điều kiện, thời hạn, lượt dùng.',
          'Mọi thao tác voucher đi qua CouponService của M09 (OPEN_DECISIONS #9).',
          'Hiển thị phân bố hạng thành viên qua API-M07-06.',
        ]}
        description="Quản trị voucher và hạng thành viên. Voucher dùng chung bảng coupons nhưng chỉ M09 ghi dữ liệu."
      />
    </div>
  );
}
