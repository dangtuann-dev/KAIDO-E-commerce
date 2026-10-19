'use client';

/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCampaignEditor
 * SRS: M09-F01, M09-F03, M09-F05 | API: API-M09-02, API-M09-04, API-M09-05 | BR: BR-M09-01, BR-M09-04
 * Route: /admin/marketing/campaigns, /admin/marketing/banners
 * UI: Form chiến dịch/banner: lịch hiển thị, trọng số, loại, voucher liên kết và trạng thái.
 * Trạng thái: TODO — component khung (Giai đoạn 7).
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F01): Bổ sung API quản trị chiến dịch còn thiếu; nối useCreateBanner/useCreateCoupon và cron campaigns.
export default function AdminCampaignEditor() {
  return (
    <ModuleStub
      moduleCode="TOY-M09"
      moduleName="Nội dung và chiến dịch quảng bá"
      componentName="AdminCampaignEditor"
      route="/admin/marketing/campaigns"
      srsRefs={[
        'M09-F01',
        'M09-F03',
        'M09-F05',
        'API-M09-02',
        'API-M09-04',
        'API-M09-05',
        'BR-M09-01',
        'BR-M09-04',
      ]}
      todos={[
        'Bổ sung API quản trị chiến dịch còn thiếu; nối useCreateBanner/useCreateCoupon và cron campaigns.',
        'Nối API-M09-02, API-M09-04, API-M09-05 qua hook TanStack Query và xử lý trạng thái tải/rỗng/lỗi.',
      ]}
      description="Form chiến dịch/banner: lịch hiển thị, trọng số, loại, voucher liên kết và trạng thái."
      headingLevel="h2"
    />
  );
}
