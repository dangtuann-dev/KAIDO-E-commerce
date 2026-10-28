'use client';

/**
 * [TOY-M08] AdminInventoryPage — tồn kho theo SKU/kho (M08-F03).
 * Tổng hợp on_hand/reserved/available, lọc kho và SKU sắp hết, phân trang.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import LowStockAlertBanner from '../components/LowStockAlertBanner.jsx';
import StockLevelBadge from '../components/StockLevelBadge.jsx';
import { formatDateTime, formatNumber } from '../constants.js';
import { useInventorySummary } from '../hooks/use-inventory-summary.js';
import { useListInventoryStock } from '../hooks/use-list-inventory-stock.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';

const PAGE_SIZE = 20;

const SUMMARY_CARDS = [
  { key: 'total_skus', label: 'SKU theo dõi', tone: 'text-ink' },
  { key: 'on_hand', label: 'Tồn thực tế', tone: 'text-ink' },
  { key: 'reserved', label: 'Đang giữ cho đơn', tone: 'text-primary' },
  { key: 'available', label: 'Khả dụng để bán', tone: 'text-success-strong' },
  { key: 'low_stock_count', label: 'SKU sắp hết', tone: 'text-accent-active' },
  { key: 'out_of_stock_count', label: 'SKU hết hàng', tone: 'text-sale' },
];

function SummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-[86px] w-full" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const lowStockFromUrl = searchParams.get('low_stock') === '1';

  const [filters, setFilters] = useState(() => ({
    keyword: '',
    warehouse_id: '',
    low_stock_only: lowStockFromUrl,
    page: 1,
  }));
  const [keywordDraft, setKeywordDraft] = useState('');
  const [lastLowStockParam, setLastLowStockParam] = useState(lowStockFromUrl);

  if (lastLowStockParam !== lowStockFromUrl) {
    setLastLowStockParam(lowStockFromUrl);
    setFilters((current) => ({ ...current, low_stock_only: lowStockFromUrl, page: 1 }));
  }

  const warehousesQuery = useListWarehouses({ query: { include_inactive: false } });
  const summaryQuery = useInventorySummary();
  const stockQuery = useListInventoryStock({
    query: {
      page: filters.page,
      limit: PAGE_SIZE,
      keyword: filters.keyword || undefined,
      warehouse_id: filters.warehouse_id || undefined,
      low_stock_only: filters.low_stock_only || undefined,
    },
  });

  const warehouseOptions = (warehousesQuery.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} · ${warehouse.name}`,
    disabled: warehouse.is_active === false,
  }));

  const summary = summaryQuery.data;
  const items = stockQuery.data?.items ?? [];
  const hasFilters = Boolean(filters.keyword || filters.warehouse_id || filters.low_stock_only);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Kho &amp; tồn kho</h1>
          <p className="mt-1 text-body-s text-slate">
            {stockQuery.data
              ? `${formatNumber(stockQuery.data.total)} dòng tồn kho`
              : 'Đang tải dữ liệu tồn kho…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/inventory/receipts/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
          >
            Tạo phiếu nhập
          </Link>
          <Link
            href="/admin/inventory/audit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
          >
            Kiểm kê
          </Link>
          <Link
            href="/admin/inventory/settings"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
          >
            Cấu hình kho &amp; NCC
          </Link>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <LowStockAlertBanner summary={summary} showWhenClear />

        {summaryQuery.isPending ? (
          <SummarySkeleton />
        ) : summaryQuery.isError ? null : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {SUMMARY_CARDS.map((card) => (
              <div key={card.key} className="rounded-md border border-fog bg-white px-4 py-3">
                <p className="text-caption uppercase tracking-wide text-slate">{card.label}</p>
                <p className={`mt-1 font-heading text-h4 ${card.tone}`}>
                  {formatNumber(summary?.[card.key])}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        className="mt-5 flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters((current) => ({ ...current, keyword: keywordDraft.trim(), page: 1 }));
        }}
      >
        <Input
          label="Tìm theo SKU hoặc tên sản phẩm"
          type="search"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          placeholder="Ví dụ: KAIDO"
          containerClassName="min-w-[240px] flex-1"
        />
        <Select
          label="Kho"
          value={filters.warehouse_id}
          onChange={(event) =>
            setFilters((current) => ({ ...current, warehouse_id: event.target.value, page: 1 }))
          }
          options={[{ value: '', label: 'Tất cả kho' }, ...warehouseOptions]}
          containerClassName="min-w-[200px]"
        />
        <Checkbox
          label="Chỉ SKU sắp hết / hết hàng"
          checked={filters.low_stock_only}
          onChange={(event) =>
            setFilters((current) => ({ ...current, low_stock_only: event.target.checked, page: 1 }))
          }
          containerClassName="pb-1"
        />
        <Button type="submit" size="sm">
          Lọc
        </Button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setKeywordDraft('');
              setFilters({ keyword: '', warehouse_id: '', low_stock_only: false, page: 1 });
            }}
            className="min-h-[44px] px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
          >
            Xóa lọc
          </button>
        ) : null}
      </form>

      <div className="mt-5 rounded-md border border-fog bg-white">
        {stockQuery.isPending ? (
          <TableSkeleton />
        ) : stockQuery.isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {stockQuery.error?.message || 'Không tải được dữ liệu tồn kho.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => stockQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Không có dòng tồn kho phù hợp"
            description={
              hasFilters
                ? 'Thử bộ lọc khác hoặc xóa lọc để xem toàn bộ tồn kho.'
                : 'Tồn kho sẽ xuất hiện sau khi bạn tạo phiếu nhập kho đầu tiên.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-body-s">
              <caption className="sr-only">Tồn kho theo SKU và kho</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    SKU / Sản phẩm
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Kho
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Tồn
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Đang giữ
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Khả dụng
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Ngưỡng
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thẻ kho
                  </th>
                </tr>
              </thead>
              <tbody className={stockQuery.isFetching ? 'opacity-60' : undefined}>
                {items.map((row) => (
                  <tr
                    key={row.stock_id ?? `${row.variant_id}-${row.warehouse_id}`}
                    className="border-b border-fog last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-caption font-semibold text-ink">{row.sku}</p>
                      <p className="text-slate">{row.product_name || '—'}</p>
                      {row.variant_name ? (
                        <p className="text-caption text-slate">{row.variant_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate">{row.warehouse_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-ink">{formatNumber(row.on_hand)}</td>
                    <td className="px-4 py-3 text-right text-primary">
                      {formatNumber(row.reserved)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {formatNumber(row.available)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate">
                      {formatNumber(row.low_stock_threshold)}
                    </td>
                    <td className="px-4 py-3">
                      <StockLevelBadge
                        available={row.available}
                        threshold={row.low_stock_threshold}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(row.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/inventory/stock-cards?sku=${encodeURIComponent(row.sku)}&warehouse_id=${row.warehouse_id}`}
                        className="font-semibold text-primary"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stockQuery.data ? (
        <Pagination
          page={stockQuery.data.page}
          totalPages={stockQuery.data.total_pages}
          disabled={stockQuery.isFetching}
          onPageChange={(nextPage) => setFilters((current) => ({ ...current, page: nextPage }))}
          className="mt-6"
        />
      ) : null}
    </div>
  );
}
