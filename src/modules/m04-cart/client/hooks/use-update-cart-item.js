'use client';

import { useMutation } from '@tanstack/react-query';
import { updateCartItem } from '../services/cart.api.js';

/**
 * API-M04-03 — Cập nhật số lượng
 * TanStack Query mutation khung cho PUT /api/v1/cart/items/[itemId].
 * TODO(API-M04-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useUpdateCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateCartItem(variables),
    ...options,
  });
}
