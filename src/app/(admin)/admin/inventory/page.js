import { Suspense } from 'react';
import AdminInventoryPage from '@/modules/m08-inventory/client/pages/AdminInventoryPage.jsx';

export const metadata = {
  title: 'Tồn kho',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminInventoryPage />
    </Suspense>
  );
}
