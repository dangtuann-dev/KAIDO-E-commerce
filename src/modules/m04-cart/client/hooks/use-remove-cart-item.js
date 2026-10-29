'use client';

import { useMutation } from '@tanstack/react-query';
import { removeCartItem } from '../services/cart.api.js';

/**
 * API-M04-04 — Xóa sản phẩm khỏi giỏ
 * TanStack Query mutation cho DELETE /api/v1/cart/items/[itemId].
 * Response có `removed_item` + `undo_window_ms` để UI mở Undo 5 giây (M04-F04).
 */
export function useRemoveCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => removeCartItem(variables),
    ...options,
  });
}
