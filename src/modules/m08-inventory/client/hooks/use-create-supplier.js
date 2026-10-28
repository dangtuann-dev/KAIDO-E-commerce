'use client';

import { useMutation } from '@tanstack/react-query';
import { createSupplier } from '../services/inventory.api.js';

/** API-M08-13 — Tạo nhà cung cấp. */
export function useCreateSupplier(options = {}) {
  return useMutation({
    mutationFn: (variables) => createSupplier(variables),
    ...options,
  });
}
