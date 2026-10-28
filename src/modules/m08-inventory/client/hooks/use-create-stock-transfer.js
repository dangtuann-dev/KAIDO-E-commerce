'use client';

import { useMutation } from '@tanstack/react-query';
import { createStockTransfer } from '../services/inventory.api.js';

/** API-M08-19 — Tạo phiếu chuyển kho. */
export function useCreateStockTransfer(options = {}) {
  return useMutation({
    mutationFn: (variables) => createStockTransfer(variables),
    ...options,
  });
}
