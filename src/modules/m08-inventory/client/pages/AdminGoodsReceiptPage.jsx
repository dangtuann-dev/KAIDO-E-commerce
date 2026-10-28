'use client';

/**
 * [TOY-M08] AdminGoodsReceiptPage — lập phiếu nhập kho (M08-F02, M08-F12).
 * Form nhập theo SKU + lịch sử phiếu nhập gần đây.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Pagination from '@/shared/ui/pagination.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { GoodsReceiptForm } from '../components/GoodsReceiptModal.jsx';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONES, formatDateTime } from '../constants.js';
import { useCreateGoodsReceipt } from '../hooks/use-create-goods-receipt.js';
import { useListGoodsReceipts } from '../hooks/use-list-goods-receipts.js';
import { useListSuppliers } from '../hooks/use-list-suppliers.js';
import { useListWarehouses } from '../hooks/use-list-warehouses.js';

const HISTORY_PAGE_SIZE = 10;

export default function AdminGoodsReceiptPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useCreateGoodsReceipt();

  const [formKey, setFormKey] = useState(0);
  const [serverError, setServerError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const suppliersQuery = useListSuppliers({ query: { include_inactive: false } });
  const warehousesQuery = useListWarehouses({ query: { include_inactive: false } });
  const receiptsQuery = useListGoodsReceipts({
    query: { page: historyPage, limit: HISTORY_PAGE_SIZE },
  });

  const activeSuppliers = (suppliersQuery.data ?? []).filter((supplier) => supplier.is_active);
  const activeWarehouses = (warehousesQuery.data ?? []).filter((warehouse) => warehouse.is_active);
  const receipts = receiptsQuery.data?.items ?? [];

  async function handleCreate(body) {
    setServerError('');
    try {
      const result = await mutation.mutateAsync({ body });
      toast.success(`Đã tạo phiếu nhập ${result?.code ?? ''}.`.trim());
      setFormKey((current) => current + 1);
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-15').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-08').code] });
      await queryClient.invalidateQueries({ queryKey: [getApiEndpoint('API-M08-23').code] });
    } catch (error) {
      setServerError(error?.message || 'Không tạo được phiếu nhập.');
    }
  }

  const isLoadingOptions = suppliersQuery.isPending || warehousesQuery.isPending;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Phiếu nhập kho</h1>
          <p className="mt-1 text-body-s text-slate">
            Nhập hàng từ nhà cung cấp; tồn kho được cộng ngay khi tạo phiếu.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
        >
          ← Về tồn kho
        </Link>
      </div>

      <div className="mt-5 rounded-md border border-fog bg-white p-5">
        {isLoadingOptions ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : activeSuppliers.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có nhà cung cấp đang hợp tác"
            description="Thêm nhà cung cấp trong trang cấu hình kho trước khi lập phiếu nhập."
            action={
              <Link
                href="/admin/inventory/settings"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
              >
                Cấu hình kho &amp; NCC
              </Link>
            }
          />
        ) : activeWarehouses.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Chưa có kho đang hoạt động"
            description="Tạo kho trước khi lập phiếu nhập."
            action={
              <Link
                href="/admin/inventory/settings"
                className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
              >
                Cấu hình kho
              </Link>
            }
          />
        ) : (
          <GoodsReceiptForm
            key={formKey}
            suppliers={activeSuppliers}
            warehouses={activeWarehouses}
            onSubmit={handleCreate}
            submitting={mutation.isPending}
            error={serverError}
          />
        )}
      </div>

      <section aria-labelledby="receipt-history-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="receipt-history-title" className="font-heading text-h4 text-ink">
              Phiếu nhập gần đây
            </h2>
            <p className="mt-1 text-body-s text-slate">
              {receiptsQuery.data
                ? `${receiptsQuery.data.total} phiếu nhập`
                : 'Đang tải lịch sử phiếu nhập…'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-fog bg-white">
          {receiptsQuery.isPending ? (
            <div className="space-y-2 p-4" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : receiptsQuery.isError ? (
            <div className="p-6 text-center">
              <p role="alert" className="text-body-s text-sale">
                {receiptsQuery.error?.message || 'Không tải được lịch sử phiếu nhập.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => receiptsQuery.refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              className="border-0"
              title="Chưa có phiếu nhập"
              description="Phiếu nhập đầu tiên sẽ xuất hiện tại đây sau khi bạn tạo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-body-s">
                <caption className="sr-only">Lịch sử phiếu nhập kho</caption>
                <thead>
                  <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Mã phiếu
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Nhà cung cấp
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Kho
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Giá trị
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Người tạo / thời gian
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-fog last:border-b-0">
                      <td className="px-4 py-3 font-mono text-caption text-ink">{receipt.code}</td>
                      <td className="px-4 py-3 text-slate">{receipt.supplier_name || '—'}</td>
                      <td className="px-4 py-3 text-slate">{receipt.warehouse_name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {formatVND(receipt.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={DOCUMENT_STATUS_TONES[receipt.status] ?? 'neutral'}>
                          {DOCUMENT_STATUS_LABELS[receipt.status] ?? receipt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate">
                        <p>{receipt.created_by_name || '—'}</p>
                        <p className="text-caption">{formatDateTime(receipt.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {receiptsQuery.data ? (
          <Pagination
            page={receiptsQuery.data.page}
            totalPages={receiptsQuery.data.total_pages}
            disabled={receiptsQuery.isFetching}
            onPageChange={setHistoryPage}
            className="mt-6"
          />
        ) : null}
      </section>
    </div>
  );
}
