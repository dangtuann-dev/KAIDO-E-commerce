'use client';

import { useMutation } from '@tanstack/react-query';
import { selectCartItems } from '../services/cart.api.js';

/**
 * API-M04-09 — Xác thực sản phẩm chọn thanh toán
 * PUT /api/v1/cart/selection; trả tạm tính/tổng tiền của đúng các dòng đã chọn (M04-F06).
 */
export function useSelectCartItems(options = {}) {
  return useMutation({
    mutationFn: (variables) => selectCartItems(variables),
    ...options,
  });
}
