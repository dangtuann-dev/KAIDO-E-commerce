'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import Button from '@/shared/ui/button.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import MembershipCard from '../components/MembershipCard.jsx';
import VoucherWalletModal from '../components/VoucherWalletModal.jsx';
import LoyaltyHistoryTable from '../components/LoyaltyHistoryTable.jsx';
import { getMyPoints, getPointHistory } from '../services/loyalty.api.js';

const vnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const num = (value) => Number(value || 0).toLocaleString('vi-VN');

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-fog p-5">
      <p className="text-caption text-slate">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function LoyaltyContent() {
  const toast = useToast();
  const [walletOpen, setWalletOpen] = useState(false);

  async function handleUseVoucher(code) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã ${code}. Dán mã ở bước thanh toán để được giảm giá.`);
    } catch {
      toast.info(`Mã giảm giá của bạn: ${code}`);
    }
  }

  const pointsQuery = useQuery({
    queryKey: ['loyalty', 'points'],
    queryFn: () => getMyPoints(),
  });

  const recentQuery = useQuery({
    queryKey: ['loyalty', 'history', 1, 5],
    queryFn: () => getPointHistory({ query: { page: 1, limit: 5 } }),
  });

  if (pointsQuery.isPending) {
    return <p className="py-10 text-center text-slate">Đang tải...</p>;
  }
  if (pointsQuery.error) {
    return (
      <p role="alert" className="py-10 text-center text-sale">
        {pointsQuery.error.message}
      </p>
    );
  }

  const points = pointsQuery.data;
  const vouchers = points?.vouchers ?? [];
  const usableVouchers = vouchers.filter((voucher) => voucher.usable);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Điểm thưởng &amp; hạng thành viên</h1>
        <Button variant="outline" onClick={() => setWalletOpen(true)}>
          Ví voucher ({usableVouchers.length})
        </Button>
      </div>

      <MembershipCard data={points} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Điểm hiện có" value={num(points.total_points)} />
        <Stat label="Giá trị quy đổi" value={vnd(points.value_vnd)} />
        <Stat label="Sắp hết hạn (30 ngày)" value={num(points.points_expiring)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Giao dịch gần đây</h2>
          <Link href="/account/loyalty/history" className="text-body-s font-semibold text-primary">
            Xem tất cả
          </Link>
        </div>

        <LoyaltyHistoryTable
          items={recentQuery.data?.history ?? []}
          total={recentQuery.data?.total ?? 0}
          page={1}
          totalPages={1}
          loading={recentQuery.isPending}
          error={recentQuery.error}
        />
      </section>

      <VoucherWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        vouchers={vouchers}
        onSelect={handleUseVoucher}
      />
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <ProtectedRoute>
      <LoyaltyContent />
    </ProtectedRoute>
  );
}
