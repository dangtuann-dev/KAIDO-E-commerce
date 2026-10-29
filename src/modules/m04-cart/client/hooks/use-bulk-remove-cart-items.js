'use client';

import { useMutation } from '@tanstack/react-query';
import { bulkRemoveCartItems } from '../services/cart.api.js';

/**
 * API-M04-05 — Xóa nhiều sản phẩm
 * TanStack Query mutation cho POST /api/v1/cart/items/bulk-delete (M04-F04).
 * Tối đa 50 dòng mỗi lần; response trả `removed_items` để UI hoàn tác.
 */
export function useBulkRemoveCartItems(options = {}) {
  return useMutation({
    mutationFn: (variables) => bulkRemoveCartItems(variables),
    ...options,
  });
}
