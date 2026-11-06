'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — VariantSelector
 * SRS: M02-F09, BR-M02-01, BR-M02-05 | API: API-M02-03, API-M04-02
 * Route: /products/[slug]
 * UI: Chọn biến thể theo SKU, hiển thị tồn kho từng biến thể, thêm vào giỏ (M04).
 */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import Button from '@/shared/ui/button.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { cn } from '@/shared/utils/cn.js';
import { useAddCartItem } from '@/modules/m04-cart/public.client.js';
import ProductStockBadge from './ProductStockBadge.jsx';

const CART_QUERY_KEY = getApiEndpoint('API-M04-01').code;

function initialVariantId(variants) {
  const preferred = variants.find((variant) => variant.is_default) ?? variants[0];
  return preferred?.id ?? null;
}

export default function VariantSelector({
  variants = [],
  productId = null,
  productName = 'sản phẩm',
}) {
  const list = useMemo(() => (Array.isArray(variants) ? variants : []), [variants]);
  const [selectedId, setSelectedId] = useState(() => initialVariantId(list));
  const selected = list.find((variant) => variant.id === selectedId) ?? list[0] ?? null;
  const soldOut = selected?.stock?.status === 'OUT_OF_STOCK';

  const toast = useToast();
  const queryClient = useQueryClient();
  const addMutation = useAddCartItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
      toast.success(`Đã thêm ${productName} vào giỏ hàng.`);
    },
    onError: (error) => {
      toast.error(error?.message || 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
    },
  });

  function handleAddToCart() {
    if (!productId || !selected?.id || soldOut || addMutation.isPending) return;

    addMutation.mutate({
      body: {
        product_id: productId,
        variant_id: selected.id,
        quantity: 1,
      },
    });
  }

  const addDisabled = !productId || !selected || soldOut || addMutation.isPending;

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
        <Button
          type="button"
          size="lg"
          onClick={handleAddToCart}
          disabled={addDisabled}
          aria-describedby={soldOut ? 'cart-unavailable-note' : undefined}
        >
          {soldOut
            ? 'Tạm hết hàng'
            : addMutation.isPending
              ? 'Đang thêm vào giỏ…'
              : 'Thêm vào giỏ hàng'}
        </Button>
        {soldOut ? (
          <p id="cart-unavailable-note" className="text-caption text-slate">
            Phân loại này hiện đã hết hàng — vui lòng chọn phân loại khác.
          </p>
        ) : null}
      </div>
    </div>
  );
}
