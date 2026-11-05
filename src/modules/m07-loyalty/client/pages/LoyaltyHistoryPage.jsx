'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import LoyaltyHistoryTable from '../components/LoyaltyHistoryTable.jsx';
import { getPointHistory } from '../services/loyalty.api.js';

const LIMIT = 20;

function HistoryContent() {
  const [page, setPage] = useState(1);

  const { data, isPending, error } = useQuery({
    queryKey: ['loyalty', 'history', page, LIMIT],
    queryFn: () => getPointHistory({ query: { page, limit: LIMIT } }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Lịch sử điểm thưởng</h1>
        <Link href="/account/loyalty" className="text-body-s font-semibold text-primary">
          Về trang điểm thưởng
        </Link>
      </div>

      <LoyaltyHistoryTable
        items={data?.history ?? []}
        page={data?.page ?? page}
        total={data?.total ?? 0}
        totalPages={data?.total_pages ?? 1}
        loading={isPending}
        error={error}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function LoyaltyHistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
