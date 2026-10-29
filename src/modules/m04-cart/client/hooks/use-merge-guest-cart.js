'use client';

import { useMutation } from '@tanstack/react-query';
import { mergeGuestCart } from '../services/cart.api.js';

/**
 * API-M04-06 — Gộp giỏ khách vào thành viên
 * TanStack Query mutation cho POST /api/v1/cart/merge.
 * Cùng SKU cộng dồn nhưng không vượt tồn khả dụng (M04-F08).
 */
export function useMergeGuestCart(options = {}) {
  return useMutation({
    mutationFn: (variables) => mergeGuestCart(variables),
    ...options,
  });
}
