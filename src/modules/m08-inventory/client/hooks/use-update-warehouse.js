'use client';

import { useMutation } from '@tanstack/react-query';
import { updateWarehouse } from '../services/inventory.api.js';

/** API-M08-11 — Cập nhật kho (ADMIN). */
export function useUpdateWarehouse(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateWarehouse(variables),
    ...options,
  });
}
