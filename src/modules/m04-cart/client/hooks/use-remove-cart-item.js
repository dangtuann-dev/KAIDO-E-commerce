'use client';

import { useMutation } from '@tanstack/react-query';
import { removeCartItem } from '../services/cart.api.js';

/**
 * API-M04-04 — Xóa sản phẩm khỏi giỏ
 * TanStack Query mutation khung cho DELETE /api/v1/cart/items/[itemId].
 * TODO(API-M04-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useRemoveCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => removeCartItem(variables),
    ...options,
  });
}
