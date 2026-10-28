'use client';

import { useMutation } from '@tanstack/react-query';
import { createBrand } from '../services/catalog.api.js';

/** API-M02-16 — Tạo thương hiệu. */
export function useCreateBrand(options = {}) {
  return useMutation({ mutationFn: (variables) => createBrand(variables), ...options });
}
