'use client';

import { useMutation } from '@tanstack/react-query';
import { createWarehouse } from '../services/inventory.api.js';

/** API-M08-10 — Tạo kho (ADMIN). */
export function useCreateWarehouse(options = {}) {
  return useMutation({
    mutationFn: (variables) => createWarehouse(variables),
    ...options,
  });
}
