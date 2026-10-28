'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — VariantSelector
 * SRS: M02-F09, BR-M02-01, BR-M02-05 | API: API-M02-03
 * Route: /products/[slug]
 * UI: Chọn biến thể theo SKU, hiển thị tồn kho từng biến thể.
 * Nút thêm giỏ tạm khóa vì API giỏ hàng (M04) chưa triển khai.
 */
import { useMemo, useState } from 'react';
import Button from '@/shared/ui/button.jsx';
import { cn } from '@/shared/utils/cn.js';
import ProductStockBadge from './ProductStockBadge.jsx';

function initialVariantId(variants) {
  const preferred = variants.find((variant) => variant.is_default) ?? variants[0];
  return preferred?.id ?? null;
}

export default function VariantSelector({ variants = [], productName = 'sản phẩm' }) {
  const list = useMemo(() => (Array.isArray(variants) ? variants : []), [variants]);
  const [selectedId, setSelectedId] = useState(() => initialVariantId(list));
  const selected = list.find((variant) => variant.id === selectedId) ?? list[0] ?? null;
  const soldOut = selected?.stock?.status === 'OUT_OF_STOCK';

  return (
    <div className="flex flex-col gap-4">
      {list.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-body-s font-semibold text-ink">Phân loại</legend>
          <div className="flex flex-wrap gap-2">
            {list.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={variant.id === selected?.id}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-2 rounded-sm border px-3.5 text-body-s font-semibold transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  variant.id === selected?.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-fog bg-white text-ink hover:border-primary/60',
                )}
              >
                {variant.name}
                <span className="text-caption font-normal text-slate">{variant.sku}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {selected ? (
        <div className="flex flex-wrap items-center gap-3">
          <ProductStockBadge stock={selected.stock} showQuantity />
          <span className="text-body-s text-slate">SKU: {selected.sku}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="button" size="lg" disabled aria-describedby="cart-unavailable-note">
          {soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
        </Button>
        <p id="cart-unavailable-note" className="text-caption text-slate">
          Giỏ hàng trực tuyến (M04) đang được hoàn thiện — vui lòng liên hệ cửa hàng để đặt{' '}
          {productName}.
        </p>
      </div>
    </div>
  );
}
