'use client';

import { useMutation } from '@tanstack/react-query';
import { updateCartItem } from '../services/cart.api.js';

/**
 * API-M04-03 — Cập nhật số lượng
 * TanStack Query mutation cho PUT /api/v1/cart/items/[itemId].
 * `quantity: 0` xóa dòng (BR-M04-06).
 */
export function useUpdateCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateCartItem(variables),
    ...options,
  });
}
