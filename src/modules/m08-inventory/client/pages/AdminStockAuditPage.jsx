'use client';

/**
 * [TOY-M08] AdminStockAuditPage — kiểm kê và điều chỉnh tồn (M08-F09).
 * Chênh lệch vượt ngưỡng sẽ chờ ADMIN duyệt trước khi áp dụng.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ROLES } from '@/shared/constants/roles.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Input from '@/shared/ui/input.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Select from '@/shared/ui/select.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import StockAuditTable from '../components/StockAuditTable.jsx';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONES, formatDateTime } from '../constants.js';
import { useCreateStockAdjustment } from '../hooks/use-create-stock-adjustment.js';
import { useDecideStockAdjustment } from '../hooks/use-decide-stock-adjustment.js';
import { useListInventoryStock } from '../hooks/use-list-inventory-stock.js';
import { useListStockAdjustments } from '../hooks/use-list-stock-adjustments.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';

const HISTORY_PAGE_SIZE = 10;

function toCount(value) {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AdminStockAuditPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore(selectAuthUser);
  const isAdmin = user?.role === ROLES.ADMIN;

  const [warehouseId, setWarehouseId] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [values, setValues] = useState({});
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [decisionError, setDecisionError] = useState('');

  const warehousesQuery = useListWarehouses({ query: { include_inactive: false } });
  const activeWarehouses = useMemo(
    () => (warehousesQuery.data ?? []).filter((warehouse) => warehouse.is_active),
    [warehousesQuery.data],
  );

  const defaultWarehouse = useMemo(
    () => activeWarehouses.find((warehouse) => warehouse.is_default) ?? activeWarehouses[0] ?? null,
    [activeWarehouses],
  );
  const effectiveWarehouseId = warehouseId || defaultWarehouse?.id || '';

  function selectWarehouse(nextId) {
    setWarehouseId(nextId);
    setValues({});
    setFormError('');
    setLastResult(null);
  }

  const stockQuery = useListInventoryStock(
    {
      query: {
        warehouse_id: effectiveWarehouseId || undefined,
        keyword: keyword || undefined,
        page: 1,
        limit: 100,
      },
    },
    { enabled: Boolean(effectiveWarehouseId) },
  );

  const adjustmentsQuery = useListStockAdjustments({
    query: {
      page: 1,
      limit: HISTORY_PAGE_SIZE,
      warehouse_id: effectiveWarehouseId || undefined,
    },
  });

  const createMutation = useCreateStockAdjustment();
  const decideMutation = useDecideStockAdjustment();

  const rows = useMemo(() => stockQuery.data?.items ?? [], [stockQuery.data]);

  const warehouseOptions = activeWarehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} · ${warehouse.name}`,
  }));

  function handleValueChange(sku, value) {
    setValues((current) => ({ ...current, [sku]: value }));
  }

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-16').code] });
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-08').code] });
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-22').code] });
    await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setLastResult(null);

    if (!effectiveWarehouseId) {
      setFormError('Chọn kho cần kiểm kê.');
      return;
    }
    if (reason.trim().length < 10) {
      setFormError('Lý do điều chỉnh tối thiểu 10 ký tự.');
      return;
    }

    const items = [];
    for (const row of rows) {
      const counted = toCount(values[row.sku]);
      if (counted === null) continue;
      const diff = counted - (Number(row.on_hand) || 0);
      if (diff === 0) continue;
      items.push({ sku: row.sku, diff_quantity: diff, reason: reason.trim() });
    }

    if (items.length === 0) {
      setFormError('Nhập số đếm thực tế cho ít nhất một SKU có chênh lệch khác 0.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        body: { warehouse_id: effectiveWarehouseId, items },
      });
      setLastResult(result);
      setValues({});
      setReason('');

      if (result?.status === 'PENDING_APPROVAL') {
        toast.warning(`Phiếu ${result.code} đang chờ Quản trị viên duyệt.`);
      } else {
        toast.success(`Đã áp dụng điều chỉnh tồn kho (${result?.code ?? ''}).`.trim());
      }

      await invalidate();
    } catch (error) {
      setFormError(error?.message || 'Không tạo được phiếu kiểm kê.');
    }
  }

  async function confirmDecision() {
    if (!pendingDecision) return;
    setDecisionError('');
    try {
      await decideMutation.mutateAsync({
        id: pendingDecision.adjustment.id,
        body: { action: pendingDecision.action },
      });
      toast.success(
        pendingDecision.action === 'APPROVE'
          ? `Đã duyệt phiếu ${pendingDecision.adjustment.code}.`
          : `Đã hủy phiếu ${pendingDecision.adjustment.code}.`,
      );
      setPendingDecision(null);
      await invalidate();
    } catch (error) {
      setDecisionError(error?.message || 'Không cập nhật được phiếu kiểm kê.');
    }
  }

  const adjustments = adjustmentsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Kiểm kê kho</h1>
          <p className="mt-1 text-body-s text-slate">
            Nhập số đếm thực tế; hệ thống tự tính chênh lệch và ghi nhật ký điều chỉnh.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
        >
          ← Về tồn kho
        </Link>
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-fog bg-white p-4">
          <Select
            label="Kho kiểm kê"
            required
            value={effectiveWarehouseId}
            onChange={(event) => selectWarehouse(event.target.value)}
            options={warehouseOptions}
            placeholder="Chọn kho"
            containerClassName="min-w-[220px]"
          />
          <Input
            label="Tìm SKU / sản phẩm"
            type="search"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
            placeholder="Để trống để tải 100 SKU đầu"
            containerClassName="min-w-[240px] flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setKeyword(keywordDraft.trim())}
          >
            Tải danh sách
          </Button>
        </div>

        {!effectiveWarehouseId ? (
          <EmptyState
            title="Chọn kho để bắt đầu"
            description="Bảng kiểm kê chỉ hiển thị SKU thuộc một kho tại một thời điểm."
          />
        ) : stockQuery.isPending ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : stockQuery.isError ? (
          <div className="rounded-md border border-fog bg-white p-6 text-center">
            <p role="alert" className="text-body-s text-sale">
              {stockQuery.error?.message || 'Không tải được danh sách SKU.'}
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
        ) : (
          <StockAuditTable
            rows={rows}
            values={values}
            onValueChange={handleValueChange}
            disabled={createMutation.isPending}
          />
        )}

        {rows.length > 0 ? (
          <div className="rounded-md border border-fog bg-white p-4">
            <Input
              label="Lý do điều chỉnh"
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Kiểm kê định kỳ tháng 10, phát hiện thiếu hàng"
              hint="Lý do tối thiểu 10 ký tự, áp dụng cho tất cả SKU trong phiếu."
              maxLength={500}
            />

            {formError ? (
              <p role="alert" className="mt-3 text-body-s text-sale">
                {formError}
              </p>
            ) : null}

            {lastResult ? (
              <p
                role="status"
                className="mt-3 rounded-sm border border-primary/30 bg-surface-sky px-3 py-2 text-body-s text-ink"
              >
                Phiếu {lastResult.code} ·{' '}
                {DOCUMENT_STATUS_LABELS[lastResult.status] ?? lastResult.status}
                {lastResult.requires_admin_approval
                  ? ' — cần Quản trị viên duyệt trước khi áp dụng.'
                  : ' — đã áp dụng vào tồn kho.'}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                loading={createMutation.isPending}
                loadingLabel="Đang gửi phiếu…"
              >
                Gửi phiếu kiểm kê
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      <section aria-labelledby="adjustment-history-title" className="mt-8">
        <h2 id="adjustment-history-title" className="font-heading text-h4 text-ink">
          Phiếu kiểm kê gần đây
        </h2>

        <div className="mt-4 rounded-md border border-fog bg-white">
          {adjustmentsQuery.isPending ? (
            <div className="space-y-2 p-4" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : adjustmentsQuery.isError ? (
            <div className="p-6 text-center">
              <p role="alert" className="text-body-s text-sale">
                {adjustmentsQuery.error?.message || 'Không tải được phiếu kiểm kê.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => adjustmentsQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : adjustments.length === 0 ? (
            <EmptyState
              className="border-0"
              title="Chưa có phiếu kiểm kê"
              description="Phiếu kiểm kê sẽ xuất hiện tại đây sau khi bạn gửi."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-body-s">
                <caption className="sr-only">Lịch sử phiếu kiểm kê</caption>
                <thead>
                  <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Mã phiếu
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Kho
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Lý do
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      SKU
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Người tạo / duyệt
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="border-b border-fog last:border-b-0">
                      <td className="px-4 py-3 font-mono text-caption text-ink">
                        {adjustment.code}
                      </td>
                      <td className="px-4 py-3 text-slate">{adjustment.warehouse_name || '—'}</td>
                      <td className="px-4 py-3 text-slate">{adjustment.reason}</td>
                      <td className="px-4 py-3 text-right">{adjustment.item_count}</td>
                      <td className="px-4 py-3">
                        <Badge tone={DOCUMENT_STATUS_TONES[adjustment.status] ?? 'neutral'}>
                          {DOCUMENT_STATUS_LABELS[adjustment.status] ?? adjustment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate">
                        <p>{adjustment.created_by_name || '—'}</p>
                        <p className="text-caption">
                          {formatDateTime(adjustment.created_at)}
                          {adjustment.approved_by_name
                            ? ` · duyệt bởi ${adjustment.approved_by_name}`
                            : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && adjustment.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setDecisionError('');
                                setPendingDecision({ adjustment, action: 'APPROVE' });
                              }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDecisionError('');
                                setPendingDecision({ adjustment, action: 'CANCEL' });
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <p className="text-right text-caption text-slate">—</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(pendingDecision)}
        onClose={() => setPendingDecision(null)}
        title={
          pendingDecision?.action === 'APPROVE'
            ? `Duyệt phiếu ${pendingDecision.adjustment.code}?`
            : `Hủy phiếu ${pendingDecision?.adjustment.code}?`
        }
        description={
          pendingDecision?.action === 'APPROVE'
            ? 'Chênh lệch kiểm kê sẽ được áp dụng ngay vào tồn kho.'
            : 'Phiếu chờ duyệt sẽ bị hủy, không ảnh hưởng tồn kho.'
        }
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setPendingDecision(null)}>
              Đóng
            </Button>
            <Button
              type="button"
              variant={pendingDecision?.action === 'APPROVE' ? 'primary' : 'danger'}
              loading={decideMutation.isPending}
              onClick={confirmDecision}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        {decisionError ? (
          <p role="alert" className="text-body-s text-sale">
            {decisionError}
          </p>
        ) : (
          <p className="text-body-s text-slate">
            Phiếu này có {pendingDecision?.adjustment.item_count ?? 0} SKU điều chỉnh.
          </p>
        )}
      </Modal>
    </div>
  );
}
