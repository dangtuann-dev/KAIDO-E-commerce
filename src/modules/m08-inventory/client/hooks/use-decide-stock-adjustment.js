'use client';

import { useMutation } from '@tanstack/react-query';
import { decideStockAdjustment } from '../services/inventory.api.js';

/** API-M08-17 — Duyệt/hủy phiếu kiểm kê (ADMIN). */
export function useDecideStockAdjustment(options = {}) {
  return useMutation({
    mutationFn: (variables) => decideStockAdjustment(variables),
    ...options,
  });
}
