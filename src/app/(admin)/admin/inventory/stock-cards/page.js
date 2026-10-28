import { Suspense } from 'react';
import AdminStockCardPage from '@/modules/m08-inventory/client/pages/AdminStockCardPage.jsx';

export const metadata = {
  title: 'Thẻ kho',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminStockCardPage />
    </Suspense>
  );
}
