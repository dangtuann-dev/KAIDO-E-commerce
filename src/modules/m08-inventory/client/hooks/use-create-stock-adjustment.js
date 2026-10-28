'use client';

import { useMutation } from '@tanstack/react-query';
import { createStockAdjustment } from '../services/inventory.api.js';

/** API-M08-06 — Tạo phiếu kiểm kê/điều chỉnh. */
export function useCreateStockAdjustment(options = {}) {
  return useMutation({
    mutationFn: (variables) => createStockAdjustment(variables),
    ...options,
  });
}
