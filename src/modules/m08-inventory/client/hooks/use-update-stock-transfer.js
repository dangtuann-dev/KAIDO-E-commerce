'use client';

import { useMutation } from '@tanstack/react-query';
import { updateStockTransfer } from '../services/inventory.api.js';

/** API-M08-20 — Xuất/nhận/hủy phiếu chuyển kho. */
export function useUpdateStockTransfer(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateStockTransfer(variables),
    ...options,
  });
}
