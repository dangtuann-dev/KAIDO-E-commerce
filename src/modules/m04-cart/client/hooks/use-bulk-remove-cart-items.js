'use client';

import { useMutation } from '@tanstack/react-query';
import { bulkRemoveCartItems } from '../services/cart.api.js';

/**
 * API-M04-05 — Xóa nhiều sản phẩm
 * TanStack Query mutation khung cho POST /api/v1/cart/items/bulk-delete.
 * TODO(API-M04-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useBulkRemoveCartItems(options = {}) {
  return useMutation({
    mutationFn: (variables) => bulkRemoveCartItems(variables),
    ...options,
  });
}
