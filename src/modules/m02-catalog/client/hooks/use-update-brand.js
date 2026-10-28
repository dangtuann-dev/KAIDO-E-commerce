'use client';

import { useMutation } from '@tanstack/react-query';
import { updateBrand } from '../services/catalog.api.js';

/** API-M02-17 — Cập nhật thương hiệu. */
export function useUpdateBrand(options = {}) {
  return useMutation({ mutationFn: (variables) => updateBrand(variables), ...options });
}
