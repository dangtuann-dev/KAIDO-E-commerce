'use client';

/**
 * [TOY-M07] Khuyến mãi và khách thân thiết — AdminVouchersPage
 * SRS: M07-F01, M07-F05 | API: API-M07-05, API-M07-06 | BR: BR-M09-02
 * Route: /admin/loyalty/vouchers
 * UI: Tạo voucher qua CouponService M09 + bảng phân bố hạng thành viên.
 */
import Link from 'next/link';
import { useState } from 'react';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import Button from '@/shared/ui/button.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { formatVND } from '@/shared/utils/formatVND.js';
import AdminVoucherForm from '../components/AdminVoucherForm.jsx';
import { useGetTierSummary } from '../hooks/use-get-tier-summary.js';

const TYPE_LABEL = {
  PERCENT: 'Giảm theo phần trăm',
  FIXED: 'Giảm số tiền cố định',
  FREESHIP: 'Miễn phí vận chuyển',
};

function voucherSummary(voucher) {
  if (voucher.type === 'FREESHIP') return 'Miễn phí vận chuyển';
  if (voucher.type === 'PERCENT') return `${voucher.value}%`;
  return formatVND(voucher.value);
}

function TierSummaryTable() {
  const query = useGetTierSummary();

  if (query.isPending) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="text-center">
        <p className="text-body-s text-slate">Không tải được thống kê hạng thành viên.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const tiers = query.data?.tiers ?? query.data ?? [];
  if (tiers.length === 0) {
    return <p className="text-body-s text-slate">Chưa cấu hình hạng thành viên.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-body-s">
        <thead className="bg-fog/40 text-caption uppercase tracking-wide text-slate">
          <tr>
            <th scope="col" className="px-3 py-2">
              Hạng
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Thành viên
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Chi tiêu tối thiểu
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Hệ số điểm
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fog">
          {tiers.map((tier) => (
            <tr key={tier.tier}>
              <td className="px-3 py-2 font-semibold text-ink">{tier.name ?? tier.tier}</td>
              <td className="px-3 py-2 text-right">{Number(tier.member_count ?? 0).toLocaleString('vi-VN')}</td>
              <td className="px-3 py-2 text-right text-slate">{formatVND(tier.min_spent ?? 0)}</td>
              <td className="px-3 py-2 text-right text-slate">×{tier.point_multiplier ?? 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminVouchersContent() {
  const [created, setCreated] = useState([]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản trị voucher khách thân thiết</h1>
          <p className="mt-1 text-body-s text-slate">
            Voucher dùng chung CouponService với M09; chỉ ADMIN hoặc MARKETING mới tạo được mã.
          </p>
        </div>
        <Link
          href="/admin/marketing/coupons"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
        >
          Quản lý toàn bộ mã (M09)
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-fog bg-white p-5">
          <h2 className="mb-4 font-semibold">Tạo voucher</h2>
          <AdminVoucherForm onCreated={(item) => setCreated((list) => [item, ...list])} />
        </section>

        <section className="rounded-md border border-fog bg-white p-5">
          <h2 className="mb-1 font-semibold">Phân bố hạng thành viên</h2>
          <p className="mb-4 text-caption text-slate">
            Hạng xét theo chi tiêu 12 tháng gần nhất (BR-M07-03).
          </p>
          <TierSummaryTable />
        </section>
      </div>

      {created.length > 0 ? (
        <section>
          <h2 className="mb-3 font-semibold">Mã vừa tạo trong phiên này</h2>
          <ul className="divide-y divide-fog">
            {created.map((item) => (
              <li key={item.voucher_id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-mono font-semibold">{item.code}</p>
                  <p className="text-caption text-slate">
                    {TYPE_LABEL[item.type] ?? item.type} · {voucherSummary(item)}
                    {item.min_order > 0 && ` · đơn từ ${formatVND(item.min_order)}`}
                  </p>
                </div>
                <span className="text-body-s font-semibold text-success-strong">{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function AdminVouchersPage() {
  return (
    <ProtectedRoute>
      <AdminVouchersContent />
    </ProtectedRoute>
  );
}
