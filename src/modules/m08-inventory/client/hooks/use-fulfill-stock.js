'use client';

import { useMutation } from '@tanstack/react-query';
import { fulfillStock } from '../services/inventory.api.js';

/** API-M08-04 — Xuất kho thực tế cho đơn hàng. */
export function useFulfillStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => fulfillStock(variables),
    ...options,
  });
}
