'use client';

import { useMutation } from '@tanstack/react-query';
import { reserveStock } from '../services/inventory.api.js';

/** API-M08-02 — Giữ tồn kho cho đơn hàng. */
export function useReserveStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => reserveStock(variables),
    ...options,
  });
}
