'use client';

/**
 * [TOY-M08] TransferManager — chuyển kho nội bộ (M08-F10).
 * Luồng: nháp → xuất kho nguồn (đang chuyển) → nhận hàng ở kho đích.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { DOCUMENT_STATUS_TONES, formatDateTime, transferStage } from '../constants.js';
import { useCreateStockTransfer } from '../hooks/use-create-stock-transfer.js';
import { useListStockTransfers } from '../hooks/use-list-stock-transfers.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';
import { useUpdateStockTransfer } from '../hooks/use-update-stock-transfer.js';

const CELL_INPUT_CLASS =
  'block w-full rounded-sm border border-fog bg-white px-3 py-2 text-body-s text-ink placeholder:text-mist focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'APPROVED', label: 'Đã xuất kho / đã nhận' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

function createItem() {
  return { sku: '', quantity: '' };
}

function TransferForm({ warehouses = [], onSubmit, submitting, error: externalError }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([createItem()]);
  const [localError, setLocalError] = useState('');

  const warehouseOptions = warehouses.map((warehouse) => ({
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
    setLocalError('');

    if (!fromId || !toId) {
      setLocalError('Chọn kho nguồn và kho đích.');
      return;
    }
    if (fromId === toId) {
      setLocalError('Kho đích phải khác kho nguồn.');
      return;
    }

    const rows = [];
    for (const [index, item] of items.entries()) {
      const sku = item.sku.trim().toUpperCase();
      const quantity = Number(item.quantity);
      if (!sku) {
        setLocalError(`Dòng ${index + 1}: nhập SKU.`);
        return;
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setLocalError(`Dòng ${index + 1}: số lượng phải là số nguyên dương.`);
        return;
      }
      rows.push({ sku, quantity });
    }

    await onSubmit({
      from_warehouse_id: fromId,
      to_warehouse_id: toId,
      note: note.trim() || undefined,
      items: rows,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Kho nguồn"
          required
          value={fromId}
          onChange={(event) => setFromId(event.target.value)}
          options={warehouseOptions}
          placeholder="Chọn kho nguồn"
        />
        <Select
          label="Kho đích"
          required
          value={toId}
          onChange={(event) => setToId(event.target.value)}
          options={warehouseOptions}
          placeholder="Chọn kho đích"
        />
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-end gap-2">
            <input
              aria-label={`SKU dòng ${index + 1}`}
              value={item.sku}
              onChange={(event) => updateItem(index, 'sku', event.target.value)}
              placeholder="SKU"
              className={`${CELL_INPUT_CLASS} flex-1 font-mono uppercase`}
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

      {localError || externalError ? (
        <p role="alert" className="text-body-s text-sale">
          {localError || externalError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} loadingLabel="Đang tạo phiếu…">
          Tạo phiếu chuyển
        </Button>
      </div>
    </form>
  );
}

export default function TransferManager({ canEdit = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState('');

  const transfersQuery = useListStockTransfers({ query: { status: status || undefined } });
  const warehousesQuery = useListWarehouses({ query: { include_inactive: false } });
  const createMutation = useCreateStockTransfer();
  const updateMutation = useUpdateStockTransfer();

  const transfers = transfersQuery.data?.items ?? [];
  const activeWarehouses = (warehousesQuery.data ?? []).filter((warehouse) => warehouse.is_active);

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-18').code] });
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-08').code] });
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
  }

  async function handleCreate(body) {
    setCreateError('');
    try {
      const result = await createMutation.mutateAsync({ body });
      toast.success(`Đã tạo phiếu chuyển ${result?.code ?? ''}.`.trim());
      setOpenCreate(false);
      await invalidate();
    } catch (error) {
      setCreateError(error?.message || 'Không tạo được phiếu chuyển.');
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionError('');
    try {
      await updateMutation.mutateAsync({
        id: pendingAction.transfer.id,
        body: { action: pendingAction.action },
      });
      toast.success(pendingAction.successMessage);
      setPendingAction(null);
      await invalidate();
    } catch (error) {
      setActionError(error?.message || 'Không thực hiện được thao tác.');
    }
  }

  function transferActions(transfer) {
    if (!canEdit) return null;
    const actions = [];
    if (transfer.status === 'DRAFT') {
      actions.push({
        action: 'SHIP',
        label: 'Xuất kho',
        tone: 'primary',
        successMessage: `Đã xuất kho nguồn cho phiếu ${transfer.code}.`,
      });
      actions.push({
        action: 'CANCEL',
        label: 'Hủy',
        tone: 'danger',
        successMessage: `Đã hủy phiếu ${transfer.code}.`,
      });
    } else if (transfer.status === 'APPROVED' && !transfer.received_at) {
      actions.push({
        action: 'RECEIVE',
        label: 'Nhận hàng',
        tone: 'primary',
        successMessage: `Đã nhận hàng vào kho đích cho phiếu ${transfer.code}.`,
      });
    }
    return actions;
  }

  return (
    <section aria-labelledby="transfer-manager-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="transfer-manager-title" className="font-heading text-h4 text-ink">
            Chuyển kho nội bộ
          </h2>
          <p className="mt-1 text-body-s text-slate">
            Xuất khỏi kho nguồn trước, sau đó nhận vào kho đích để cộng tồn.
          </p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setOpenCreate(true)}>
            Tạo phiếu chuyển
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Select
          label="Trạng thái"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={STATUS_OPTIONS}
          containerClassName="min-w-[200px]"
        />
      </div>

      <div className="mt-4 rounded-md border border-fog bg-white">
        {transfersQuery.isPending ? (
          <div className="space-y-2 p-4" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : transfersQuery.isError ? (
          <div className="p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {transfersQuery.error?.message || 'Không tải được phiếu chuyển kho.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => transfersQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : transfers.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có phiếu chuyển kho"
            description="Tạo phiếu để điều chuyển hàng giữa các kho."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-body-s">
              <caption className="sr-only">Danh sách phiếu chuyển kho</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Mã phiếu
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Lộ trình
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tạo lúc
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-fog last:border-b-0">
                    <td className="px-4 py-3 font-mono text-caption text-ink">{transfer.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">
                        {transfer.from_warehouse_name || '—'} → {transfer.to_warehouse_name || '—'}
                      </p>
                      <p className="text-caption text-slate">{transfer.note || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{transfer.item_count}</td>
                    <td className="px-4 py-3">
                      <Badge tone={DOCUMENT_STATUS_TONES[transfer.status] ?? 'neutral'}>
                        {transferStage(transfer)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateTime(transfer.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {(transferActions(transfer) ?? []).map((action) => (
                          <Button
                            key={action.action}
                            type="button"
                            size="sm"
                            variant={action.tone === 'danger' ? 'outline' : action.tone}
                            onClick={() => {
                              setActionError('');
                              setPendingAction({ transfer, ...action });
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Tạo phiếu chuyển kho"
        description="Phiếu mới ở trạng thái nháp; xuất kho nguồn để bắt đầu vận chuyển."
        size="lg"
      >
        {openCreate ? (
          <TransferForm
            warehouses={activeWarehouses}
            onSubmit={handleCreate}
            submitting={createMutation.isPending}
            error={createError}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction?.label ? `${pendingAction.label} phiếu ${pendingAction.transfer.code}?` : ''
        }
        description={
          pendingAction?.action === 'RECEIVE'
            ? 'Hàng sẽ được cộng vào kho đích và thao tác không thể hoàn tác.'
            : pendingAction?.action === 'SHIP'
              ? 'Tồn kho nguồn sẽ bị trừ và phiếu chuyển sang trạng thái đang vận chuyển.'
              : 'Phiếu nháp sẽ bị hủy, không ảnh hưởng tồn kho.'
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPendingAction(null)}>
              Đóng
            </Button>
            <Button
              type="button"
              variant={pendingAction?.tone === 'danger' ? 'danger' : 'primary'}
              loading={updateMutation.isPending}
              onClick={confirmAction}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        {actionError ? (
          <p role="alert" className="text-body-s text-sale">
            {actionError}
          </p>
        ) : (
          <p className="text-body-s text-slate">
            Phiếu <span className="font-semibold text-ink">{pendingAction?.transfer.code}</span> sẽ
            được cập nhật ngay.
          </p>
        )}
      </Modal>
    </section>
  );
}
