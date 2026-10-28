'use client';

/**
 * [TOY-M08] InventoryHistoryLog — thẻ kho bất biến (M08-F13, NFR-M08-03).
 * Render dữ liệu từ API-M08-07; không có thao tác sửa/xóa trên log.
 */
import Badge from '@/shared/ui/badge.jsx';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { formatNumber, formatDateTime, MOVEMENT_TYPE_LABELS } from '../constants.js';

const MOVEMENT_TONES = {
  IMPORT: 'success',
  RETURN: 'success',
  TRANSFER_IN: 'info',
  RESERVE: 'warning',
  RELEASE: 'neutral',
  FULFILL: 'danger',
  EXPORT: 'danger',
  TRANSFER_OUT: 'danger',
  ADJUST: 'primary',
};

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-md border border-fog bg-white px-4 py-3">
      <p className="text-caption uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-heading text-h4 text-ink">{formatNumber(value)}</p>
      {hint ? <p className="text-caption text-slate">{hint}</p> : null}
    </div>
  );
}

export default function InventoryHistoryLog({ card, isPending, isError, error, onRetry }) {
  if (isPending) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-fog bg-white p-6 text-center">
        <p role="alert" className="text-body-s text-sale">
          {error?.message || 'Không tải được thẻ kho.'}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!card) {
    return (
      <EmptyState
        title="Chưa có dữ liệu thẻ kho"
        description="Chọn SKU, kho và khoảng ngày để xem biến động tồn kho."
      />
    );
  }

  const movements = card.movements ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-h4 text-ink">
          {card.sku} · {card.product_name || 'Sản phẩm'}
        </h2>
        <p className="mt-1 text-body-s text-slate">
          {card.variant_name ? `${card.variant_name} · ` : ''}
          {card.warehouse_name || 'Kho'} · Từ {card.from_date?.slice(0, 10) || 'đầu kỳ'} đến{' '}
          {card.to_date?.slice(0, 10) || 'hiện tại'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tồn đầu kỳ" value={card.opening?.on_hand} />
        <StatCard label="Đang giữ đầu kỳ" value={card.opening?.reserved} />
        <StatCard label="Tồn cuối kỳ" value={card.closing?.on_hand} />
        <StatCard label="Đang giữ cuối kỳ" value={card.closing?.reserved} />
      </div>

      <div className="rounded-md border border-fog bg-white">
        {movements.length === 0 ? (
          <EmptyState
            className="border-0"
            title="Không có biến động"
            description="Không có giao dịch kho nào trong khoảng thời gian đã chọn."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-body-s">
              <caption className="sr-only">Lịch sử biến động tồn kho {card.sku}</caption>
              <thead>
                <tr className="border-b border-fog text-caption uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Thời gian
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Loại giao dịch
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Người thực hiện
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Biến động
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Tồn sau
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Giữ sau
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const quantity = Number(movement.quantity) || 0;
                  return (
                    <tr key={movement.id} className="border-b border-fog last:border-b-0">
                      <td className="px-4 py-3 text-slate">
                        {formatDateTime(movement.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={MOVEMENT_TONES[movement.movement_type] ?? 'neutral'}>
                          {MOVEMENT_TYPE_LABELS[movement.movement_type] ?? movement.movement_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate">{movement.actor_name || 'Hệ thống'}</td>
                      <td
                        className={
                          quantity > 0
                            ? 'px-4 py-3 text-right font-semibold text-success-strong'
                            : quantity < 0
                              ? 'px-4 py-3 text-right font-semibold text-sale'
                              : 'px-4 py-3 text-right text-slate'
                        }
                      >
                        {quantity > 0 ? `+${formatNumber(quantity)}` : formatNumber(quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {formatNumber(movement.on_hand_after)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate">
                        {formatNumber(movement.reserved_after)}
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {movement.note || (movement.reference_type ? movement.reference_type : '—')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-caption text-slate">
        Nhật ký kho là dữ liệu bất biến, chỉ ghi thêm — không hỗ trợ sửa hoặc xóa (NFR-M08-03).
      </p>
    </div>
  );
}
