'use client';

import { useMutation } from '@tanstack/react-query';
import { updateSupplier } from '../services/inventory.api.js';

/** API-M08-14 — Cập nhật nhà cung cấp. */
export function useUpdateSupplier(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateSupplier(variables),
    ...options,
  });
}
