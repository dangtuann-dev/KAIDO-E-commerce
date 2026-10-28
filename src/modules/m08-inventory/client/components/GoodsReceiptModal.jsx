'use client';

/**
 * [TOY-M08] GoodsReceiptModal — lập phiếu nhập kho (M08-F02, BR-M08-04).
 * `GoodsReceiptForm` dùng độc lập ở trang /admin/inventory/receipts/new;
 * modal mặc định tự tải NCC/kho và gọi API-M08-05.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Button from '@/shared/ui/button.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Spinner from '@/shared/ui/spinner.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { formatNumber } from '../constants.js';
import { useCreateGoodsReceipt } from '../hooks/use-create-goods-receipt.js';
import { useListSuppliers } from '../hooks/use-list-suppliers.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';

const CELL_INPUT_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3 py-2 text-body-s text-ink placeholder:text-mist focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function createItem() {
  return { sku: '', quantity: '', unit_cost: '', vat_rate: '' };
}

function normalizeSku(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function buildPayload({ supplierId, warehouseId, note, items }) {
  const errors = [];
  if (!supplierId) errors.push('Chọn nhà cung cấp.');
  if (!warehouseId) errors.push('Chọn kho nhập.');
  if (items.length === 0) errors.push('Thêm ít nhất một SKU.');

  const rows = [];
  for (const [index, item] of items.entries()) {
    const sku = normalizeSku(item.sku);
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unit_cost);
    const vatRate = item.vat_rate === '' ? 0 : Number(item.vat_rate);

    if (!sku) {
      errors.push(`Dòng ${index + 1}: nhập SKU.`);
      continue;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push(`Dòng ${index + 1}: số lượng phải là số nguyên dương.`);
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      errors.push(`Dòng ${index + 1}: giá nhập không hợp lệ.`);
    }
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      errors.push(`Dòng ${index + 1}: VAT phải trong khoảng 0–100.`);
    }

    rows.push({ sku, quantity, unit_cost: Math.round(unitCost), vat_rate: vatRate });
  }

  if (errors.length > 0) {
    return { error: errors[0] };
  }

  return {
    body: {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      note: note.trim() || undefined,
      items: rows,
    },
  };
}

export function GoodsReceiptForm({
  suppliers = [],
  warehouses = [],
  onSubmit,
  submitting = false,
  error: externalError,
}) {
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([createItem()]);
  const [localError, setLocalError] = useState('');

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: `${supplier.code} · ${supplier.name}`,
  }));
  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} · ${warehouse.name}`,
  }));

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unit_cost) || 0;
    const vatRate = Number(item.vat_rate) || 0;
    return sum + quantity * unitCost * (1 + vatRate / 100);
  }, 0);

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    const result = buildPayload({ supplierId, warehouseId, note, items });
    if (result.error) {
      setLocalError(result.error);
      return;
    }

    await onSubmit?.(result.body);
  }

  const errorMessage = localError || externalError;

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Nhà cung cấp"
          required
          value={supplierId}
          onChange={(event) => setSupplierId(event.target.value)}
          options={supplierOptions}
          placeholder="Chọn nhà cung cấp"
        />
        <Select
          label="Kho nhập"
          required
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          options={warehouseOptions}
          placeholder="Chọn kho"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-fog">
        <table className="w-full min-w-[720px] text-left text-body-s">
          <caption className="sr-only">Danh sách SKU nhập kho</caption>
          <thead>
            <tr className="border-b border-fog bg-fog/30 text-caption uppercase tracking-wide text-slate">
              <th scope="col" className="px-3 py-2 font-semibold">
                SKU
              </th>
              <th scope="col" className="w-24 px-3 py-2 font-semibold">
                Số lượng
              </th>
              <th scope="col" className="w-36 px-3 py-2 font-semibold">
                Giá nhập (đ)
              </th>
              <th scope="col" className="w-24 px-3 py-2 font-semibold">
                VAT (%)
              </th>
              <th scope="col" className="w-32 px-3 py-2 text-right font-semibold">
                Thành tiền
              </th>
              <th scope="col" className="w-14 px-3 py-2">
                <span className="sr-only">Xóa dòng</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const lineTotal =
                (Number(item.quantity) || 0) *
                (Number(item.unit_cost) || 0) *
                (1 + (Number(item.vat_rate) || 0) / 100);

              return (
                <tr key={index} className="border-b border-fog last:border-b-0">
                  <td className="px-3 py-2">
                    <input
                      aria-label={`SKU dòng ${index + 1}`}
                      value={item.sku}
                      onChange={(event) => updateItem(index, 'sku', event.target.value)}
                      placeholder="KAIDO-BALANCE-01"
                      className={`${CELL_INPUT_CLASS} font-mono uppercase`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      aria-label={`Số lượng dòng ${index + 1}`}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                      className={CELL_INPUT_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`Giá nhập dòng ${index + 1}`}
                      value={item.unit_cost}
                      onChange={(event) => updateItem(index, 'unit_cost', event.target.value)}
                      className={CELL_INPUT_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      aria-label={`VAT dòng ${index + 1}`}
                      value={item.vat_rate}
                      onChange={(event) => updateItem(index, 'vat_rate', event.target.value)}
                      className={CELL_INPUT_CLASS}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-ink">
                    {formatVND(lineTotal)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label={`Xóa dòng ${index + 1}`}
                      disabled={items.length <= 1}
                      onClick={() =>
                        setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-fog/60 hover:text-sale disabled:opacity-30"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems((current) => [...current, createItem()])}
      >
        Thêm SKU
      </Button>

      <Input
        label="Ghi chú"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ví dụ: Nhập bổ sung lô tháng 10"
        maxLength={500}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-fog bg-surface-sky/30 px-4 py-3">
        <p className="text-body-s text-slate">
          Tổng số lượng:{' '}
          <span className="font-semibold text-ink">{formatNumber(totalQuantity)}</span>
        </p>
        <p className="text-body-s text-slate">
          Tổng giá trị (gồm VAT):{' '}
          <span className="font-heading text-h5 text-primary">{formatVND(totalAmount)}</span>
        </p>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-sm border border-sale/30 bg-sale/5 px-3 py-2 text-body-s text-sale"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} loadingLabel="Đang tạo phiếu…">
          Tạo phiếu nhập
        </Button>
      </div>
    </form>
  );
}

export default function GoodsReceiptModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useCreateGoodsReceipt();
  const [serverError, setServerError] = useState('');

  const suppliersQuery = useListSuppliers({ query: {} }, { enabled: open });
  const warehousesQuery = useListWarehouses(
    { query: { include_inactive: false } },
    { enabled: open },
  );

  async function handleCreate(body) {
    setServerError('');
    try {
      const result = await mutation.mutateAsync({ body });
      toast.success(`Đã tạo phiếu nhập ${result?.code ?? ''}.`.trim());
      onCreated?.(result);
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-15').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-08').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
      onClose?.();
    } catch (error) {
      setServerError(error?.message || 'Không tạo được phiếu nhập.');
    }
  }

  const isLoadingOptions = suppliersQuery.isPending || warehousesQuery.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lập phiếu nhập kho"
      description="Phiếu nhập được duyệt ngay và cộng tồn kho theo giá vốn bình quân."
      size="lg"
    >
      {isLoadingOptions ? (
        <div className="flex items-center justify-center py-10">
          <Spinner label="Đang tải nhà cung cấp và kho…" />
        </div>
      ) : (
        <GoodsReceiptForm
          suppliers={suppliersQuery.data ?? []}
          warehouses={(warehousesQuery.data ?? []).filter((warehouse) => warehouse.is_active)}
          onSubmit={handleCreate}
          submitting={mutation.isPending}
          error={serverError}
        />
      )}
    </Modal>
  );
}
