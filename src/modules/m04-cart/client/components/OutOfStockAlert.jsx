'use client';

/**
 * [TOY-M04] Giỏ hàng — OutOfStockAlert
 * SRS: M04-F09 | BR: BR-M04-02, BR-M04-03
 * Route: /cart
 * UI: Banner cảnh báo item hết hàng/ngừng bán (chặn chọn) và biến động giá/số lượng.
 * Component thuần UI: nhận `warnings` từ API-M04-01/09 qua props.
 */
import { cn } from '@/shared/utils/cn.js';

const BLOCKING_TYPES = new Set(['OUT_OF_STOCK', 'UNAVAILABLE']);

function Notice({ tone, title, items }) {
  const isDanger = tone === 'danger';
  return (
    <div
      className={cn(
        'flex gap-3 rounded-md border px-4 py-3',
        isDanger ? 'border-sale/30 bg-sale/5' : 'border-accent-active/40 bg-accent/10',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-caption font-bold text-white',
          isDanger ? 'bg-sale' : 'bg-accent-active',
        )}
      >
        !
      </span>
      <div className="min-w-0">
        <p className={cn('text-body-s font-semibold', isDanger ? 'text-sale' : 'text-ink')}>
          {title}
        </p>
        <ul className="mt-1 space-y-0.5">
          {items.map((warning) => (
            <li key={`${warning.type}-${warning.item_id}`} className="text-body-s text-slate">
              {warning.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function OutOfStockAlert({ warnings = [], className }) {
  if (!Array.isArray(warnings) || warnings.length === 0) return null;

  const blocking = warnings.filter((warning) => BLOCKING_TYPES.has(warning.type));
  const attention = warnings.filter((warning) => !BLOCKING_TYPES.has(warning.type));

  return (
    <div role="status" aria-live="polite" className={cn('space-y-2', className)}>
      {blocking.length > 0 ? (
        <Notice
          tone="danger"
          title={
            blocking.length === 1
              ? 'Có sản phẩm không thể thanh toán'
              : `${blocking.length} sản phẩm không thể thanh toán`
          }
          items={blocking}
        />
      ) : null}
      {attention.length > 0 ? (
        <Notice
          tone="warning"
          title="Giỏ hàng vừa được cập nhật"
          items={attention}
        />
      ) : null}
    </div>
  );
}
