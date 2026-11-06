/**
 * [TOY-M04] API công khai phía client — Giỏ hàng
 * Chỉ file này được import từ module khác (ESLint kaido/no-deep-cross-module-imports).
 * Components: CartBadge, MiniCartDrawer, CartItemRow, CartSummaryCard, OutOfStockAlert,
 * CouponInputBox, SavedItemsList, GuestCartMerger.
 */
export { default as CartBadge } from './client/components/CartBadge.jsx';
export { default as MiniCartDrawer } from './client/components/MiniCartDrawer.jsx';
export { default as CartItemRow } from './client/components/CartItemRow.jsx';
export { default as CartSummaryCard } from './client/components/CartSummaryCard.jsx';
export { default as OutOfStockAlert } from './client/components/OutOfStockAlert.jsx';
export { default as CouponInputBox } from './client/components/CouponInputBox.jsx';
export { default as SavedItemsList } from './client/components/SavedItemsList.jsx';
export { default as GuestCartMerger } from './client/components/GuestCartMerger.jsx';

// Hooks dùng chéo module (M02 — nút thêm vào giỏ; M05 — fallback dòng đã chọn khi vào /checkout).
export { useAddCartItem } from './client/hooks/use-add-cart-item.js';
export { useGetCart } from './client/hooks/use-get-cart.js';
