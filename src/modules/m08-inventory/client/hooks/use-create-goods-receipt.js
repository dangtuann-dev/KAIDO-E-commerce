'use client';

import { useMutation } from '@tanstack/react-query';
import { createGoodsReceipt } from '../services/inventory.api.js';

/** API-M08-05 — Tạo phiếu nhập kho. */
export function useCreateGoodsReceipt(options = {}) {
  return useMutation({
    mutationFn: (variables) => createGoodsReceipt(variables),
    ...options,
  });
}
