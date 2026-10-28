'use client';

/**
 * [TOY-M08] ReturnedGoodsForm — nhập lại hàng hoàn/đổi trả (M08-F08).
 * Hàng SELLABLE cộng tồn khả dụng; hàng DAMAGED chỉ ghi nhận, không cộng tồn.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { formatNumber } from '../constants.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';
import { useReceiveReturnedStock } from '../hooks/use-receive-returned-stock.js';

const CELL_INPUT_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3 py-2 text-body-s text-ink placeholder:text-mist focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const CONDITION_OPTIONS = [
  { value: 'SELLABLE', label: 'Bán lại được' },
  { value: 'DAMAGED', label: 'Hư hỏng' },
];

function createItem() {
  return { sku: '', quantity: '', condition: 'SELLABLE' };
}

export default function ReturnedGoodsForm({ canEdit = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const warehousesQuery = useListWarehouses({ query: { include_inactive: false } });
  const mutation = useReceiveReturnedStock();

  const [orderRef, setOrderRef] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([createItem()]);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const warehouseOptions = (warehousesQuery.data ?? [])
    .filter((warehouse) => warehouse.is_active)
    .map((warehouse) => ({
      value: warehouse.id,
      label: `${warehouse.code} · ${warehouse.name}`,
    }));

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLastResult(null);

    if (!orderRef.trim()) {
      setError('Nhập mã đơn hàng hoàn.');
      return;
    }
    if (!warehouseId) {
      setError('Chọn kho nhận hàng hoàn.');
      return;
    }

    const rows = [];
    for (const [index, item] of items.entries()) {
      const sku = item.sku.trim().toUpperCase();
      const quantity = Number(item.quantity);
      if (!sku) {
        setError(`Dòng ${index + 1}: nhập SKU.`);
        return;
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError(`Dòng ${index + 1}: số lượng phải là số nguyên dương.`);
        return;
      }
      rows.push({ sku, quantity, condition: item.condition });
    }

    try {
      const result = await mutation.mutateAsync({
        body: {
          order_ref: orderRef.trim(),
          warehouse_id: warehouseId,
          note: note.trim() || undefined,
          items: rows,
        },
      });

      setLastResult(result);
      toast.success(`Đã nhập hàng hoàn cho đơn ${result?.order_ref ?? orderRef.trim()}.`);
      setItems([createItem()]);
      setNote('');

      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-08').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
    } catch (submitError) {
      setError(submitError?.message || 'Không nhập được hàng hoàn.');
    }
  }

  return (
    <section aria-labelledby="returned-goods-title">
      <div>
        <h2 id="returned-goods-title" className="font-heading text-h4 text-ink">
          Nhập hàng hoàn
        </h2>
        <p className="mt-1 text-body-s text-slate">
          Hàng bán lại được sẽ cộng tồn kho; hàng hư hỏng chỉ ghi nhận để đối soát.
        </p>
      </div>

      {!canEdit ? (
        <p className="mt-4 rounded-md border border-fog bg-white px-4 py-3 text-body-s text-slate">
          Bạn không có quyền nhập hàng hoàn.
        </p>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mã đơn hàng"
              required
              value={orderRef}
              onChange={(event) => setOrderRef(event.target.value)}
              placeholder="Ví dụ: KD-20261028-0001"
              maxLength={50}
            />
            <Select
              label="Kho nhận"
              required
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              options={warehouseOptions}
              placeholder="Chọn kho"
            />
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2">
                <input
                  aria-label={`SKU dòng ${index + 1}`}
                  value={item.sku}
                  onChange={(event) => updateItem(index, 'sku', event.target.value)}
                  placeholder="SKU"
                  className={`${CELL_INPUT_CLASS} min-w-[180px] flex-1 font-mono uppercase`}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label={`Số lượng dòng ${index + 1}`}
                  value={item.quantity}
                  onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                  placeholder="SL"
                  className={`${CELL_INPUT_CLASS} w-24`}
                />
                <select
                  aria-label={`Tình trạng dòng ${index + 1}`}
                  value={item.condition}
                  onChange={(event) => updateItem(index, 'condition', event.target.value)}
                  className={`${CELL_INPUT_CLASS} w-40`}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Xóa dòng ${index + 1}`}
                  disabled={items.length <= 1}
                  onClick={() =>
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  className="inline-flex h-[42px] w-10 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-fog/60 hover:text-sale disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((current) => [...current, createItem()])}
            >
              Thêm SKU
            </Button>
          </div>

          <Input
            label="Ghi chú"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
          />

          {error ? (
            <p
              role="alert"
              className="rounded-sm border border-sale/30 bg-sale/5 px-3 py-2 text-body-s text-sale"
            >
              {error}
            </p>
          ) : null}

          {lastResult ? (
            <p
              role="status"
              className="rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-body-s text-ink"
            >
              Đã nhập {formatNumber(lastResult.sellable_quantity)} sản phẩm bán lại được và ghi nhận{' '}
              {formatNumber(lastResult.damaged_quantity)} sản phẩm hư hỏng.
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" loading={mutation.isPending} loadingLabel="Đang nhập hàng…">
              Nhập hàng hoàn
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
