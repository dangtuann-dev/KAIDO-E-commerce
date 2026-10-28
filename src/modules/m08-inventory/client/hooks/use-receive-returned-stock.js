'use client';

import { useMutation } from '@tanstack/react-query';
import { receiveReturnedStock } from '../services/inventory.api.js';

/** API-M08-21 — Nhập hàng hoàn về kho. */
export function useReceiveReturnedStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => receiveReturnedStock(variables),
    ...options,
  });
}
