'use client';

import { useMutation } from '@tanstack/react-query';
import { addCartItem } from '../services/cart.api.js';

/**
 * API-M04-02 — Thêm sản phẩm vào giỏ
 * TanStack Query mutation cho POST /api/v1/cart/items.
 * Server chặn vượt tồn khả dụng và giới hạn 20 đơn vị/SKU (BR-M04-01, BR-M04-05).
 */
export function useAddCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => addCartItem(variables),
    ...options,
  });
}
