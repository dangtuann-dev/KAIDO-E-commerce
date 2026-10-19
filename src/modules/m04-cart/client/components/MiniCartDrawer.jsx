'use client';

/**
 * [TOY-M04] Giỏ hàng — MiniCartDrawer
 * SRS: M04-F02, M04-F03, API-M04-01, API-M04-03
 * Route: Toàn site — Header
 * UI: Drawer giỏ hàng thu nhỏ: danh sách item, tạm tính, CTA xem giỏ/thanh toán.
 */
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import Button from '@/shared/ui/button.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useGetCart } from '../hooks/use-get-cart.js';
import { useUpdateCartItem } from '../hooks/use-update-cart-item.js';
import { useRemoveCartItem } from '../hooks/use-remove-cart-item.js';

const CART_QUERY_KEY = getApiEndpoint('API-M04-01').code;
const MAX_QUANTITY = BUSINESS_RULES.CART.MAX_QUANTITY_PER_ITEM;

const LINK_PRIMARY =
  'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const LINK_OUTLINE =
  'inline-flex min-h-[44px] flex-1 items-center justify-center rounded-sm border border-fog bg-white px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function normalizeItem(item) {
  const quantity = Number(item?.quantity) || 1;
  const unitPrice = Number(item?.unit_price ?? item?.price ?? 0);
  return {
    id: item?.item_id ?? item?.id,
    name: item?.product_name ?? item?.name ?? item?.variant?.product_name ?? 'Sản phẩm',
    image: item?.image_url ?? item?.thumbnail ?? item?.product?.image_url ?? null,
    variant: item?.variant_name ?? item?.variant?.name ?? item?.sku ?? null,
    quantity,
    unitPrice,
    lineTotal: Number(item?.line_total ?? unitPrice * quantity),
  };
}

export default function MiniCartDrawer({ open, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const closeButtonRef = useRef(null);

  const cartQuery = useGetCart({}, { enabled: open, retry: false, staleTime: 30_000 });
  const refreshCart = () => queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });

  const updateMutation = useUpdateCartItem({
    onSuccess: refreshCart,
    onError: (error) => toast.error(error?.message ?? 'Không cập nhật được số lượng.'),
  });
  const removeMutation = useRemoveCartItem({
    onSuccess: refreshCart,
    onError: (error) => toast.error(error?.message ?? 'Không xóa được sản phẩm.'),
  });

  useEffect(() => {
    if (!open) return undefined;

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const cart = cartQuery.data;
  const items = Array.isArray(cart?.items) ? cart.items.map(normalizeItem) : [];
  const subtotal = Number(cart?.selected_subtotal ?? cart?.estimated_total ?? 0);
  const discount = Number(cart?.total_discount ?? 0);
  const estimatedTotal = Number(cart?.estimated_total ?? Math.max(0, subtotal - discount));
  const updatingItemId = updateMutation.isPending ? updateMutation.variables?.itemId : null;
  const removingItemId = removeMutation.isPending ? removeMutation.variables?.itemId : null;

  function changeQuantity(itemId, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > MAX_QUANTITY) return;
    updateMutation.mutate({ itemId, body: { quantity: nextQuantity } });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 transition-opacity duration-250"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mini-cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lift"
      >
        <div className="flex items-center justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <h2 id="mini-cart-title" className="font-heading text-h4 text-ink">
              Giỏ hàng của bạn
            </h2>
            <p className="mt-0.5 text-caption text-slate">
              {items.length > 0
                ? `${cart?.total_items ?? items.length} sản phẩm đang chờ thanh toán`
                : 'Thêm vài món đồ chơi xinh xắn nhé!'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-fog/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartQuery.isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-16 w-16 shrink-0" rounded="sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartQuery.isError ? (
            <div className="rounded-sm border border-sale/30 bg-sale/5 px-4 py-4">
              <p className="text-body-s font-semibold text-sale">Chưa tải được giỏ hàng</p>
              <p className="mt-1 text-body-s text-slate">
                {cartQuery.error?.message ?? 'Vui lòng thử lại sau.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => cartQuery.refetch()}
                loading={cartQuery.isFetching}
              >
                Thử lại
              </Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Giỏ hàng đang trống"
              description="Khám phá bộ sưu tập đồ chơi an toàn, sáng tạo cho bé yêu của bạn."
              action={
                <Link href="/products" onClick={onClose} className={LINK_PRIMARY}>
                  Tiếp tục mua sắm
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-fog">
              {items.map((item) => {
                const isUpdating = updatingItemId === item.id;
                const isRemoving = removingItemId === item.id;
                return (
                  <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-fog bg-surface-sky">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          width={64}
                          height={64}
                          unoptimized
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="grid h-full w-full place-items-center font-heading text-h4 text-primary"
                        >
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-body-s font-semibold text-ink">{item.name}</p>
                          {item.variant ? (
                            <p className="mt-0.5 text-caption text-slate">{item.variant}</p>
                          ) : null}
                          <p className="mt-0.5 text-caption text-slate">
                            {formatVND(item.unitPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate({ itemId: item.id })}
                          disabled={isRemoving}
                          aria-label={`Xóa ${item.name} khỏi giỏ`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-sale/10 hover:text-sale disabled:opacity-40"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                          >
                            <path
                              d="M4 7h16M9 7V5h6v2M6.5 7l.8 12.1A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.9L17.5 7M10 11v6M14 11v6"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-sm border border-fog">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            aria-label={`Giảm số lượng ${item.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink transition-colors duration-250 hover:bg-fog/60 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span aria-live="polite" className="min-w-8 text-center text-body-s">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= MAX_QUANTITY}
                            aria-label={`Tăng số lượng ${item.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink transition-colors duration-250 hover:bg-fog/60 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-body-s font-semibold text-ink">
                          {formatVND(item.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-fog px-5 py-4">
            <dl className="space-y-1.5 text-body-s">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Tạm tính</dt>
                <dd className="font-semibold text-ink">{formatVND(subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate">Giảm giá</dt>
                  <dd className="font-semibold text-sale">−{formatVND(discount)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-fog pt-2">
                <dt className="font-semibold text-ink">Tạm tính sau giảm</dt>
                <dd className="font-heading text-h5 text-primary">{formatVND(estimatedTotal)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <Link href="/cart" onClick={onClose} className={LINK_OUTLINE}>
                Xem giỏ hàng
              </Link>
              <Link href="/checkout" onClick={onClose} className={LINK_PRIMARY}>
                Thanh toán
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
