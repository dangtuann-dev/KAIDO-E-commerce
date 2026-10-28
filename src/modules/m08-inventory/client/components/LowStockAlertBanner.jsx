'use client';

/**
 * [TOY-M08] LowStockAlertBanner — cảnh báo SKU sắp hết/hết hàng (M08-F11).
 * Tự tải số liệu qua API-M08-23, hoặc nhận `summary` từ trang cha để tránh gọi trùng.
 */
import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useInventorySummary } from '../hooks/use-inventory-summary.js';

export default function LowStockAlertBanner({ summary, showWhenClear = true, className }) {
  const query = useInventorySummary({ staleTime: 60_000, enabled: !summary });
  const data = summary ?? query.data;

  if (!data) {
    if (query.isError) return null;
    return <Skeleton className={cn('h-[68px] w-full', className)} rounded="md" />;
  }

  const lowStock = Number(data.low_stock_count) || 0;
  const outOfStock = Number(data.out_of_stock_count) || 0;
  const total = lowStock + outOfStock;

  if (total === 0) {
    if (!showWhenClear) return null;
    return (
      <div
        role="status"
        className={cn(
          'flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3',
          className,
        )}
      >
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
        <p className="text-body-s text-ink">
          <span className="font-semibold">Tồn kho ổn định.</span> Không có SKU nào dưới ngưỡng cảnh
          báo.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent-active/40 bg-accent/15 px-4 py-3',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-active text-caption font-bold text-ink"
        >
          !
        </span>
        <div>
          <p className="text-body-s font-semibold text-ink">{total} SKU cần nhập thêm hàng</p>
          <p className="text-caption text-slate">
            {lowStock} sắp hết · {outOfStock} đã hết hàng
          </p>
        </div>
      </div>
      <Link
        href="/admin/inventory?low_stock=1"
        className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-primary transition-colors duration-250 hover:text-primary-hover"
      >
        Xem danh sách
      </Link>
    </div>
  );
}
