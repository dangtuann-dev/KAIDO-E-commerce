'use client';

/**
 * [TOY-M04] Giỏ hàng — CartPage
 * SRS: M04-F02 … M04-F10 | API: API-M04-01 … API-M04-12 | BR: BR-M04-01 … BR-M04-06
 * Route: /cart
 * Render: Client Component. Danh sách dòng giỏ, chọn để thanh toán, stepper số lượng,
 * xóa kèm Undo 5 giây, áp voucher sơ bộ và “Để dành mua sau”.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import EmptyState from '@/shared/ui/empty-state.jsx';
import Modal from '@/shared/ui/modal.jsx';
import Skeleton from '@/shared/ui/skeleton.jsx';
import { useToast } from '@/shared/ui/toast.jsx';
import { useGetCart } from '../hooks/use-get-cart.js';
import { useAddCartItem } from '../hooks/use-add-cart-item.js';
import { useUpdateCartItem } from '../hooks/use-update-cart-item.js';
import { useRemoveCartItem } from '../hooks/use-remove-cart-item.js';
import { useBulkRemoveCartItems } from '../hooks/use-bulk-remove-cart-items.js';
import { useClearCart } from '../hooks/use-clear-cart.js';
import { useSelectCartItems } from '../hooks/use-select-cart-items.js';
import { useApplyCouponToCart } from '../hooks/use-apply-coupon-to-cart.js';
import { useSaveForLater } from '../hooks/use-save-for-later.js';
import { useRestoreSavedItem } from '../hooks/use-restore-saved-item.js';
import { useRemoveSavedItem } from '../hooks/use-remove-saved-item.js';
import CartItemRow from '../components/CartItemRow.jsx';
import CartSummaryCard from '../components/CartSummaryCard.jsx';
import CouponInputBox from '../components/CouponInputBox.jsx';
import OutOfStockAlert from '../components/OutOfStockAlert.jsx';
import SavedItemsList from '../components/SavedItemsList.jsx';

const CART_QUERY_KEY = getApiEndpoint('API-M04-01').code;
const MAX_QUANTITY = BUSINESS_RULES.CART.MAX_QUANTITY_PER_ITEM;
const UNDO_DELETE_MS = BUSINESS_RULES.CART.UNDO_DELETE_MS;
const FREE_SHIPPING_THRESHOLD = BUSINESS_RULES.SHIPPING.FREE_SHIPPING_THRESHOLD_VND;
const BLOCKING_STATUSES = new Set(['OUT_OF_STOCK', 'UNAVAILABLE']);

function CartSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex gap-3 rounded-md border border-fog bg-white p-4">
          <Skeleton className="h-20 w-20 shrink-0" rounded="sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-32" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const cartQuery = useGetCart({}, { retry: false });
  const cart = cartQuery.data;
  const items = useMemo(() => (Array.isArray(cart?.items) ? cart.items : []), [cart]);
  const savedItems = useMemo(
    () => (Array.isArray(cart?.saved_items) ? cart.saved_items : []),
    [cart],
  );
  const warnings = Array.isArray(cart?.warnings) ? cart.warnings : [];
  const maxQuantity = Number(cart?.max_quantity_per_item ?? MAX_QUANTITY);

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] }),
    [queryClient],
  );

  const addMutation = useAddCartItem();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const bulkRemoveMutation = useBulkRemoveCartItems();
  const clearMutation = useClearCart();
  const selectMutation = useSelectCartItems();
  const couponMutation = useApplyCouponToCart();
  const saveMutation = useSaveForLater();
  const restoreMutation = useRestoreSavedItem();
  const removeSavedMutation = useRemoveSavedItem();

  const [selection, setSelection] = useState(null);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [pendingSavedId, setPendingSavedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [undo, setUndo] = useState(null);
  const [couponState, setCouponState] = useState(null);

  const serverSelection = useMemo(
    () => (Array.isArray(cart?.selected_item_ids) ? cart.selected_item_ids : []),
    [cart],
  );

  const requestedSelection = selection ?? serverSelection;
  const selectedSet = useMemo(() => {
    const ownedIds = new Set(items.map((item) => item.item_id));
    return new Set(requestedSelection.filter((id) => ownedIds.has(id)));
  }, [items, requestedSelection]);

  const selectableIds = useMemo(
    () => items.filter((item) => !BLOCKING_STATUSES.has(item.stock_status)).map((item) => item.item_id),
    [items],
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));

  const selectedItems = items.filter((item) => selectedSet.has(item.item_id));
  const subtotal = items.reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);
  const discount = Number(couponState?.discount_amount ?? cart?.total_discount ?? 0);
  const estimatedTotal = Math.max(0, selectedSubtotal - discount);

  useEffect(() => {
    if (!undo) return undefined;
    const timer = setTimeout(() => setUndo(null), UNDO_DELETE_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  function handleToggle(itemId, next) {
    const nextSet = new Set(selectedSet);
    if (next) nextSet.add(itemId);
    else nextSet.delete(itemId);
    setSelection([...nextSet]);
  }

  function handleToggleAll(next) {
    setSelection(next ? [...selectableIds] : []);
  }

  async function handleQuantityChange(itemId, nextQuantity) {
    const item = items.find((entry) => entry.item_id === itemId);
    if (!item) return;

    if (nextQuantity < 1) {
      await handleRemove(item);
      return;
    }
    if (nextQuantity > maxQuantity) {
      toast.warning(`Mỗi sản phẩm chỉ được tối đa ${maxQuantity} đơn vị.`);
      return;
    }

    setPendingItemId(itemId);
    try {
      await updateMutation.mutateAsync({ itemId, body: { quantity: nextQuantity } });
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Không cập nhật được số lượng.');
      await refresh();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleRemove(item) {
    setPendingItemId(item.item_id);
    try {
      const result = await removeMutation.mutateAsync({ itemId: item.item_id });
      toast.success(result?.message ?? 'Đã xóa sản phẩm khỏi giỏ hàng.');
      if (result?.removed_item) setUndo(result.removed_item);
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được sản phẩm.');
      await refresh();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleUndo() {
    const removed = undo;
    setUndo(null);
    if (!removed?.product_id) return;

    try {
      await addMutation.mutateAsync({
        body: {
          product_id: removed.product_id,
          variant_id: removed.variant_id ?? undefined,
          quantity: removed.quantity,
        },
      });
      toast.success('Đã hoàn tác xóa sản phẩm.');
    } catch (error) {
      toast.error(error?.message ?? 'Không hoàn tác được, vui lòng thêm lại sản phẩm.');
    } finally {
      await refresh();
    }
  }

  async function handleSaveForLater(item) {
    setPendingItemId(item.item_id);
    try {
      const result = await saveMutation.mutateAsync({ itemId: item.item_id });
      toast.success(result?.message ?? 'Đã chuyển sang “Để dành mua sau”.');
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Không chuyển được sản phẩm.');
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleRestoreSaved(savedItemId) {
    setPendingSavedId(savedItemId);
    try {
      const result = await restoreMutation.mutateAsync({ savedItemId });
      toast.success(result?.message ?? 'Đã thêm lại vào giỏ hàng.');
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Không thêm lại được sản phẩm.');
    } finally {
      setPendingSavedId(null);
    }
  }

  async function handleRemoveSaved(savedItemId) {
    setPendingSavedId(savedItemId);
    try {
      const result = await removeSavedMutation.mutateAsync({ savedItemId });
      toast.success(result?.message ?? 'Đã xóa khỏi danh sách mua sau.');
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được sản phẩm.');
    } finally {
      setPendingSavedId(null);
    }
  }

  async function runConfirmedAction() {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;

    try {
      if (action === 'clear') {
        const result = await clearMutation.mutateAsync();
        toast.success(result?.message ?? 'Đã xóa toàn bộ giỏ hàng.');
      } else {
        const ids = [...selectedSet];
        if (ids.length === 0) return;
        const result = await bulkRemoveMutation.mutateAsync({ body: { item_ids: ids } });
        toast.success(result?.message ?? `Đã xóa ${result?.removed_count ?? ids.length} sản phẩm.`);
      }
      setSelection([]);
      setUndo(null);
    } catch (error) {
      toast.error(error?.message ?? 'Không xóa được sản phẩm.');
    } finally {
      await refresh();
    }
  }

  async function handleApplyCoupon(code) {
    const ids = [...selectedSet];
    const result = await couponMutation.mutateAsync({
      body: { coupon_code: code, item_ids: ids.length > 0 ? ids : undefined },
    });
    setCouponState({
      code: result?.code ?? code,
      discount_amount: Number(result?.discount_amount ?? 0),
    });
    return result;
  }

  async function handleCheckout() {
    const ids = [...selectedSet];
    if (ids.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

    try {
      const result = await selectMutation.mutateAsync({ body: { item_ids: ids } });
      const confirmed = Array.isArray(result?.selected_item_ids) ? result.selected_item_ids : ids;
      const hasWarnings = Array.isArray(result?.warnings) && result.warnings.length > 0;
      if (hasWarnings) {
        toast.warning('Một số sản phẩm vừa thay đổi giá hoặc tồn kho, vui lòng kiểm tra lại.');
        await refresh();
        return;
      }
      router.push(`/checkout?items=${encodeURIComponent(confirmed.join(','))}`);
    } catch (error) {
      toast.error(error?.message ?? 'Không thể chuyển sang bước thanh toán.');
      await refresh();
    }
  }

  const isEmpty = items.length === 0 && savedItems.length === 0;

  return (
    <div className="kaido-container py-8 md:py-10">
      <header className="mb-6">
        <nav aria-label="Đường dẫn" className="mb-2 text-caption text-slate">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink">Giỏ hàng</span>
        </nav>
        <h1 className="font-heading text-h2 text-ink">Giỏ hàng của bạn</h1>
        <p className="mt-1 text-body-s text-slate">
          {cart?.is_guest
            ? 'Giỏ hàng khách vãng lai được lưu 30 ngày. Đăng nhập để không mất sản phẩm khi đổi thiết bị.'
            : 'Kiểm tra kỹ số lượng và phân loại trước khi thanh toán nhé.'}
        </p>
      </header>

      {cartQuery.isLoading ? (
        <CartSkeleton />
      ) : cartQuery.isError ? (
        <div className="rounded-md border border-sale/30 bg-sale/5 px-4 py-5">
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
      ) : isEmpty ? (
        <EmptyState
          title="Giỏ hàng đang trống"
          description="Khám phá bộ sưu tập đồ chơi an toàn, sáng tạo cho bé yêu của bạn."
          action={
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover"
            >
              Tiếp tục mua sắm
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <OutOfStockAlert warnings={warnings} className="mb-4" />

            {items.length > 0 ? (
              <section aria-labelledby="cart-items-title">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fog pb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      disabled={selectableIds.length === 0}
                      onChange={(event) => handleToggleAll(event.target.checked)}
                      label={`Chọn tất cả (${selectableIds.length})`}
                      containerClassName="w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-caption text-slate">
                      Đã chọn {selectedSet.size}/{items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmAction('bulk')}
                      disabled={selectedSet.size === 0}
                      className="inline-flex min-h-[44px] items-center text-caption font-semibold text-slate transition-colors duration-250 hover:text-sale disabled:opacity-40"
                    >
                      Xóa đã chọn
                    </button>
                  </div>
                </div>
                <h2 id="cart-items-title" className="sr-only">
                  Sản phẩm trong giỏ hàng
                </h2>
                <ul>
                  {items.map((item) => (
                    <CartItemRow
                      key={item.item_id}
                      item={{ ...item, max_quantity_per_item: maxQuantity }}
                      selected={selectedSet.has(item.item_id)}
                      busy={pendingItemId === item.item_id}
                      maxQuantity={maxQuantity}
                      onToggle={handleToggle}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      onSaveForLater={cart?.save_for_later_enabled === false ? undefined : handleSaveForLater}
                    />
                  ))}
                </ul>
              </section>
            ) : null}

            <SavedItemsList
              items={savedItems}
              busyId={pendingSavedId}
              onRestore={handleRestoreSaved}
              onRemove={handleRemoveSaved}
            />
          </div>

          <div className="space-y-4">
            <CartSummaryCard
              itemCount={items.length}
              selectedCount={selectedSet.size}
              subtotal={subtotal}
              discount={discount}
              estimatedTotal={estimatedTotal}
              maxQuantity={maxQuantity}
              checkoutLoading={selectMutation.isPending}
              clearingAll={clearMutation.isPending}
              onCheckout={handleCheckout}
              onClearAll={() => setConfirmAction('clear')}
              freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
            />
            <CouponInputBox
              onApply={handleApplyCoupon}
              disabled={selectedSet.size === 0}
              appliedCoupon={couponState}
            />
          </div>
        </div>
      )}

      {undo ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-md bg-ink px-4 py-3 text-white shadow-lift sm:inset-x-auto sm:right-6"
        >
          <p className="min-w-0 truncate text-body-s">
            Đã xóa <span className="font-semibold">{undo.name}</span>
          </p>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-sm bg-accent px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:bg-accent-hover"
          >
            Hoàn tác
          </button>
        </div>
      ) : null}

      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'clear' ? 'Xóa toàn bộ giỏ hàng?' : 'Xóa các sản phẩm đã chọn?'}
        description={
          confirmAction === 'clear'
            ? 'Mọi sản phẩm trong giỏ sẽ bị xóa. Bạn có thể thêm lại từ trang sản phẩm.'
            : `${selectedSet.size} sản phẩm đã chọn sẽ bị xóa khỏi giỏ hàng.`
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Giữ lại
            </Button>
            <Button variant="danger" onClick={runConfirmedAction}>
              Xóa
            </Button>
          </>
        }
      />
    </div>
  );
}
