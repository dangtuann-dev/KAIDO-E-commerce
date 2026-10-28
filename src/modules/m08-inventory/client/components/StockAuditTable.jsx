'use client';

/**
 * [TOY-M08] StockAuditTable — bảng kiểm kê nhập số đếm thực tế (M08-F09).
 * Tự tính chênh lệch và cảnh báo ngưỡng cần Admin duyệt (BR-M08-05).
 */
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { cn } from '@/shared/utils/cn.js';
import EmptyState from '@/shared/ui/empty-state.jsx';
import { formatNumber } from '../constants.js';
import { formatVND } from '@/shared/utils/formatVND.js';

const INPUT_CLASS =
  'block w-28 rounded-sm border border-fog bg-white px-3 py-2 text-right text-body-s text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-fog/40';

function toCount(value) {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function auditSummary(rows, values) {
  let selected = 0;
  let quantityDelta = 0;
  let valueDelta = 0;
  let requiresAdminApproval = false;

  for (const row of rows) {
    const counted = toCount(values[row.sku]);
    if (counted === null) continue;

    const diff = counted - (Number(row.on_hand) || 0);
    const lineValue = diff * (Number(row.price_regular) || 0);
    selected += 1;
    quantityDelta += diff;
    valueDelta += lineValue;

    if (
      Math.abs(diff) > BUSINESS_RULES.INVENTORY.STOCKTAKE_ADMIN_APPROVAL_QUANTITY ||
      Math.abs(lineValue) > BUSINESS_RULES.INVENTORY.STOCKTAKE_ADMIN_APPROVAL_VALUE_VND
    ) {
      requiresAdminApproval = true;
    }
  }

  return { selected, quantityDelta, valueDelta, requiresAdminApproval };
}

export default function StockAuditTable({
  rows = [],
  values = {},
  onValueChange,
  disabled = false,
}) {
  const summary = auditSummary(rows, values);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Chưa có SKU để kiểm kê"
        description="Chọn kho và nhập từ khóa để tải danh sách SKU cần đếm."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-fog bg-white">
        <table className="w-full min-w-[820px] text-left text-body-s">
          <caption className="sr-only">Bảng kiểm kê tồn kho</caption>
          <thead>
            <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
              <th scope="col" className="px-4 py-3 font-semibold">
                SKU
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Sản phẩm
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Tồn hệ thống
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Số đếm thực tế
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Chênh lệch
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Giá trị lệch
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const counted = toCount(values[row.sku]);
              const onHand = Number(row.on_hand) || 0;
              const diff = counted === null ? null : counted - onHand;
              const lineValue = diff === null ? null : diff * (Number(row.price_regular) || 0);

              return (
                <tr key={row.sku} className="border-b border-fog last:border-b-0">
                  <td className="px-4 py-3 font-mono text-caption text-ink">{row.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{row.product_name || '—'}</p>
                    <p className="text-caption text-slate">
                      {row.variant_name || row.warehouse_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{formatNumber(onHand)}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      aria-label={`Số đếm thực tế của ${row.sku}`}
                      value={values[row.sku] ?? ''}
                      disabled={disabled}
                      onChange={(event) => onValueChange?.(row.sku, event.target.value)}
                      placeholder="—"
                      className={cn(INPUT_CLASS, 'ml-auto')}
                    />
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-semibold',
                      diff === null
                        ? 'text-slate'
                        : diff > 0
                          ? 'text-success-strong'
                          : diff < 0
                            ? 'text-sale'
                            : 'text-ink',
                    )}
                  >
                    {diff === null ? '—' : `${diff > 0 ? '+' : ''}${formatNumber(diff)}`}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right',
                      lineValue === null
                        ? 'text-slate'
                        : lineValue > 0
                          ? 'text-success-strong'
                          : lineValue < 0
                            ? 'text-sale'
                            : 'text-ink',
                    )}
                  >
                    {lineValue === null ? '—' : formatVND(lineValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-fog bg-white px-4 py-3 text-body-s">
        <p className="text-slate">
          Đã nhập số đếm cho <span className="font-semibold text-ink">{summary.selected}</span> SKU
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-slate">
            Tổng chênh lệch:{' '}
            <span
              className={cn(
                'font-semibold',
                summary.quantityDelta === 0
                  ? 'text-ink'
                  : summary.quantityDelta > 0
                    ? 'text-success-strong'
                    : 'text-sale',
              )}
            >
              {summary.quantityDelta > 0 ? '+' : ''}
              {formatNumber(summary.quantityDelta)}
            </span>
          </span>
          <span className="text-slate">
            Giá trị lệch:{' '}
            <span
              className={cn(
                'font-semibold',
                summary.valueDelta === 0
                  ? 'text-ink'
                  : summary.valueDelta > 0
                    ? 'text-success-strong'
                    : 'text-sale',
              )}
            >
              {formatVND(summary.valueDelta)}
            </span>
          </span>
        </div>
      </div>

      {summary.requiresAdminApproval ? (
        <p
          role="status"
          className="rounded-md border border-accent-active/40 bg-accent/15 px-4 py-3 text-body-s text-ink"
        >
          Chênh lệch vượt ngưỡng {BUSINESS_RULES.INVENTORY.STOCKTAKE_ADMIN_APPROVAL_QUANTITY} sản
          phẩm hoặc {formatVND(BUSINESS_RULES.INVENTORY.STOCKTAKE_ADMIN_APPROVAL_VALUE_VND)} — phiếu
          sẽ ở trạng thái chờ Quản trị viên duyệt trước khi áp dụng tồn kho.
        </p>
      ) : null}
    </div>
  );
}
