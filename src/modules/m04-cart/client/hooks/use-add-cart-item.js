'use client';

import { useMutation } from '@tanstack/react-query';
import { addCartItem } from '../services/cart.api.js';

/**
 * API-M04-02 — Thêm sản phẩm vào giỏ
 * TanStack Query mutation khung cho POST /api/v1/cart/items.
 * TODO(API-M04-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useAddCartItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => addCartItem(variables),
    ...options,
  });
}
