'use client';

import { useMutation } from '@tanstack/react-query';
import { clearCart } from '../services/cart.api.js';

/**
 * API-M04-08 — Xóa toàn bộ giỏ hàng
 * DELETE /api/v1/cart; nối M04-F05 “Xóa tất cả”.
 */
export function useClearCart(options = {}) {
  return useMutation({
    mutationFn: () => clearCart(),
    ...options,
  });
}
