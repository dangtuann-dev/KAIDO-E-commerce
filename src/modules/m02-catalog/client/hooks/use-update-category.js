'use client';

import { useMutation } from '@tanstack/react-query';
import { updateCategory } from '../services/catalog.api.js';

/** API-M02-13 — Cập nhật danh mục. */
export function useUpdateCategory(options = {}) {
  return useMutation({ mutationFn: (variables) => updateCategory(variables), ...options });
}
