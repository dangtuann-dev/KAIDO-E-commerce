'use client';

/**
 * [TOY-M08] AdminDashboardPage — tổng quan back-office.
 * Chỉ số tồn kho, cảnh báo SKU sắp hết và lối tắt theo module được phép.
 */
import Link from 'next/link';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ADMIN_SIDEBAR_MODULES } from '@/shared/rbac/permissions.js';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import LowStockAlertBanner from '../components/LowStockAlertBanner.jsx';
import StockLevelBadge from '../components/StockLevelBadge.jsx';
import { formatNumber } from '../constants.js';
import { useInventorySummary } from '../hooks/use-inventory-summary.js';
import { useListLowStock } from '../hooks/use-list-low-stock.js';

const SHORTCUTS = [
  {
    module: 'M08',
    href: '/admin/inventory',
    label: 'Tồn kho',
    description: 'Tra cứu tồn theo SKU và kho',
  },
  {
    module: 'M08',
    href: '/admin/inventory/receipts/new',
    label: 'Nhập kho',
    description: 'Lập phiếu nhập từ nhà cung cấp',
  },
  {
    module: 'M08',
    href: '/admin/inventory/audit',
    label: 'Kiểm kê',
    description: 'Đếm thực tế và điều chỉnh tồn',
  },
  {
    module: 'M08',
    href: '/admin/inventory/stock-cards',
    label: 'Thẻ kho',
    description: 'Xem lịch sử biến động tồn',
  },
  {
    module: 'M08',
    href: '/admin/inventory/settings',
    label: 'Cấu hình kho & NCC',
    description: 'Kho, nhà cung cấp, chuyển kho, hàng hoàn',
  },
  {
    module: 'M02',
    href: '/admin/products',
    label: 'Sản phẩm',
    description: 'Danh mục, biến thể và giá bán',
  },
  {
    module: 'M05',
    href: '/admin/orders',
    label: 'Đơn hàng',
    description: 'Xử lý đơn và trạng thái giao',
  },
];

export default function AdminDashboardPage() {
  const user = useAuthStore(selectAuthUser);
  const allowedModules = user?.role ? (ADMIN_SIDEBAR_MODULES[user.role] ?? []) : [];
  const canViewInventory = allowedModules.includes('M08');

  const summaryQuery = useInventorySummary({ enabled: canViewInventory });
  const lowStockQuery = useListLowStock({ query: { limit: 8 } }, { enabled: canViewInventory });

  const summary = summaryQuery.data;
  const lowStockItems = lowStockQuery.data?.items ?? [];
  const shortcuts = SHORTCUTS.filter((shortcut) => allowedModules.includes(shortcut.module));

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-heading text-h2 text-ink">Tổng quan quản trị</h1>
        <p className="mt-1 text-body-s text-slate">
          Theo dõi sức khỏe tồn kho và đi nhanh tới các nghiệp vụ thường dùng.
        </p>
      </div>

      {canViewInventory ? (
        <>
          <div className="mt-5 space-y-4">
            <LowStockAlertBanner summary={summary} showWhenClear />

            {summaryQuery.isPending ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-[90px] w-full" />
                ))}
              </div>
            ) : summaryQuery.isError ? (
              <div className="rounded-md border border-fog bg-white p-6 text-center">
                <p role="alert" className="text-body-s text-sale">
                  {summaryQuery.error?.message || 'Không tải được số liệu tồn kho.'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => summaryQuery.refetch()}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-fog bg-white px-4 py-3">
                  <p className="text-caption uppercase tracking-wide text-slate">SKU theo dõi</p>
                  <p className="mt-1 font-heading text-h3 text-ink">
                    {formatNumber(summary?.total_skus)}
                  </p>
                  <p className="text-caption text-slate">
                    {formatNumber(summary?.warehouse_count)} kho
                  </p>
                </div>
                <div className="rounded-md border border-fog bg-white px-4 py-3">
                  <p className="text-caption uppercase tracking-wide text-slate">Tồn thực tế</p>
                  <p className="mt-1 font-heading text-h3 text-ink">
                    {formatNumber(summary?.on_hand)}
                  </p>
                  <p className="text-caption text-slate">
                    Khả dụng {formatNumber(summary?.available)}
                  </p>
                </div>
                <div className="rounded-md border border-fog bg-white px-4 py-3">
                  <p className="text-caption uppercase tracking-wide text-slate">
                    Đang giữ cho đơn
                  </p>
                  <p className="mt-1 font-heading text-h3 text-primary">
                    {formatNumber(summary?.reserved)}
                  </p>
                  <p className="text-caption text-slate">Chờ xuất kho hoặc hết hạn giữ</p>
                </div>
                <div className="rounded-md border border-fog bg-white px-4 py-3">
                  <p className="text-caption uppercase tracking-wide text-slate">Cần nhập thêm</p>
                  <p className="mt-1 font-heading text-h3 text-sale">
                    {formatNumber(
                      (summary?.low_stock_count ?? 0) + (summary?.out_of_stock_count ?? 0),
                    )}
                  </p>
                  <p className="text-caption text-slate">
                    {formatNumber(summary?.low_stock_count)} sắp hết ·{' '}
                    {formatNumber(summary?.out_of_stock_count)} hết hàng
                  </p>
                </div>
              </div>
            )}
          </div>

          <section aria-labelledby="low-stock-title" className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="low-stock-title" className="font-heading text-h4 text-ink">
                  SKU cần nhập thêm
                </h2>
                <p className="mt-1 text-body-s text-slate">
                  Ưu tiên các SKU đã hết hàng hoặc xuống dưới ngưỡng cảnh báo.
                </p>
              </div>
              <Link
                href="/admin/inventory?low_stock=1"
                className="inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold text-primary transition-colors duration-250 hover:text-primary-hover"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-4 rounded-md border border-fog bg-white">
              {lowStockQuery.isPending ? (
                <div className="space-y-2 p-4" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : lowStockQuery.isError ? (
                <div className="p-6 text-center">
                  <p role="alert" className="text-body-s text-sale">
                    {lowStockQuery.error?.message || 'Không tải được danh sách tồn thấp.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => lowStockQuery.refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : lowStockItems.length === 0 ? (
                <EmptyState
                  className="border-0"
                  title="Không có SKU nào cần nhập thêm"
                  description="Tất cả SKU đang có tồn khả dụng trên ngưỡng cảnh báo."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-body-s">
                    <caption className="sr-only">SKU sắp hết hoặc hết hàng</caption>
                    <thead>
                      <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                        <th scope="col" className="px-4 py-3 font-semibold">
                          SKU / Sản phẩm
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          Kho
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">
                          Khả dụng
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((row) => (
                        <tr
                          key={row.stock_id ?? `${row.variant_id}-${row.warehouse_id}`}
                          className="border-b border-fog last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <p className="font-mono text-caption font-semibold text-ink">
                              {row.sku}
                            </p>
                            <p className="text-slate">{row.product_name || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-slate">{row.warehouse_name || '—'}</td>
                          <td className="px-4 py-3 text-right font-semibold text-ink">
                            {formatNumber(row.available)}
                          </td>
                          <td className="px-4 py-3">
                            <StockLevelBadge
                              available={row.available}
                              threshold={row.low_stock_threshold}
                              showCount={false}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {shortcuts.length > 0 ? (
        <section aria-labelledby="shortcuts-title" className="mt-8">
          <h2 id="shortcuts-title" className="font-heading text-h4 text-ink">
            Lối tắt nghiệp vụ
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="rounded-md border border-fog bg-white px-4 py-4 transition-colors duration-250 hover:border-primary"
              >
                <p className="font-heading text-h5 text-ink">{shortcut.label}</p>
                <p className="mt-1 text-body-s text-slate">{shortcut.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
