import EmptyState from '@/shared/ui/empty-state.jsx';

export const metadata = {
  title: 'Đang bảo trì',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="kaido-container py-16">
      <EmptyState
        title="KAIDO đang bảo trì"
        description="Chúng tôi đang nâng cấp hệ thống để phục vụ tốt hơn. Vui lòng quay lại sau ít phút."
      />
    </div>
  );
}
