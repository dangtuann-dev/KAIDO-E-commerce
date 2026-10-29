import { Suspense } from 'react';
import SearchPage from '@/modules/m03-search/client/pages/SearchPage.jsx';

export const metadata = {
  title: 'Tìm kiếm sản phẩm',
};

function SearchFallback() {
  return (
    <div className="kaido-container py-10" aria-busy="true">
      <p className="text-body-s text-slate">Đang tải trang tìm kiếm…</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  );
}
