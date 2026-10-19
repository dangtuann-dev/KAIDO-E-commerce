/**
 * [TOY-M09] Nội dung và chiến dịch quảng bá — AdminCampaignsPage
 * SRS: M09 | API/FR: M09-F03, M09-F05, API-M09-02, BR-M09-01
 * Route: /admin/marketing/campaigns
 * Render: Client Component (tương tác) — TODO(M09-F03).
 * Trạng thái: TODO — khung chờ triển khai (Giai đoạn 6).
 * Việc cần làm: Dựng danh sách chiến dịch: thời gian, banner, mô tả, ngân sách, trạng thái.
 */
import ModuleStub from '@/shared/ui/module-stub.jsx';

// TODO(M09-F03): dựng quản lý chiến dịch và nối API-M09-02/cron campaigns.
export default function AdminCampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ModuleStub
        moduleCode="TOY-M09"
        moduleName="Nội dung và chiến dịch quảng bá"
        componentName="AdminCampaignsPage"
        route="/admin/marketing/campaigns"
        srsRefs={['M09-F03', 'M09-F05', 'API-M09-02', 'BR-M09-01']}
        todos={[
          'Dựng danh sách chiến dịch: thời gian, banner, mô tả, ngân sách, trạng thái.',
          'Cron campaigns tự bật/kết thúc theo lịch (M09-F05).',
          'Kiểm tra hiệu lực thời gian [start_time, end_time] (BR-M09-01).',
        ]}
        description="Quản trị chiến dịch quảng bá theo mùa (Trung Thu, 1/6...) gồm banner, voucher và SKU."
      />
    </div>
  );
}
