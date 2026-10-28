'use client';

/**
 * [TOY-M08] AdminStockCardPage — thẻ kho theo SKU/kho/khoảng ngày (M08-F13).
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import InventoryHistoryLog from '../components/InventoryHistoryLog.jsx';
import { useGetStockCard } from '../hooks/use-get-stock-card.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';

export default function AdminStockCardPage() {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get('sku') ?? '';
  const initialWarehouse = searchParams.get('warehouse_id') ?? '';

  const [skuDraft, setSkuDraft] = useState(initialSku);
  const [warehouseId, setWarehouseId] = useState(initialWarehouse);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filters, setFilters] = useState(() =>
    initialSku && initialWarehouse
      ? {
          sku: initialSku.trim().toUpperCase(),
          warehouse_id: initialWarehouse,
        }
      : null,
  );
  const [formError, setFormError] = useState('');

  const warehousesQuery = useListWarehouses({ query: { include_inactive: true } });
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  const defaultWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.is_default) ?? warehouses[0] ?? null,
    [warehouses],
  );
  const effectiveWarehouseId = warehouseId || defaultWarehouse?.id || '';

  const cardQuery = useGetStockCard(filters ?? {}, { enabled: Boolean(filters) });

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} · ${warehouse.name}`,
  }));

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!skuDraft.trim()) {
      setFormError('Nhập SKU cần tra cứu.');
      return;
    }
    if (!effectiveWarehouseId) {
      setFormError('Chọn kho cần xem thẻ.');
      return;
    }
    if (fromDate && toDate && toDate < fromDate) {
      setFormError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    setFilters({
      sku: skuDraft.trim().toUpperCase(),
      warehouse_id: effectiveWarehouseId,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Thẻ kho</h1>
          <p className="mt-1 text-body-s text-slate">
            Truy vết biến động nhập, xuất, giữ tồn và điều chỉnh theo SKU.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
        >
          ← Về tồn kho
        </Link>
      </div>

      <form
        className="mt-5 flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label="SKU"
          required
          value={skuDraft}
          onChange={(event) => setSkuDraft(event.target.value.toUpperCase())}
          placeholder="KAIDO-BALANCE-01"
          containerClassName="min-w-[220px] flex-1"
        />
        <Select
          label="Kho"
          required
          value={effectiveWarehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          options={warehouseOptions}
          placeholder="Chọn kho"
          containerClassName="min-w-[200px]"
        />
        <Input
          label="Từ ngày"
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          containerClassName="min-w-[160px]"
        />
        <Input
          label="Đến ngày"
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          containerClassName="min-w-[160px]"
        />
        <Button type="submit" size="sm" loading={cardQuery.isFetching} loadingLabel="Đang tải…">
          Xem thẻ kho
        </Button>
      </form>

      {formError ? (
        <p role="alert" className="mt-3 text-body-s text-sale">
          {formError}
        </p>
      ) : null}

      <div className="mt-5">
        {!filters ? (
          <EmptyState
            title="Chưa chọn thẻ kho"
            description="Nhập SKU, chọn kho và khoảng ngày (tùy chọn) để xem biến động tồn kho."
          />
        ) : (
          <InventoryHistoryLog
            card={cardQuery.data}
            isPending={cardQuery.isPending}
            isError={cardQuery.isError}
            error={cardQuery.error}
            onRetry={() => cardQuery.refetch()}
          />
        )}
      </div>
    </div>
  );
}
