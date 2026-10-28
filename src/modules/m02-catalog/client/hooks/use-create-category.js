'use client';

import { useMutation } from '@tanstack/react-query';
import { createCategory } from '../services/catalog.api.js';

/** API-M02-12 — Tạo danh mục. */
export function useCreateCategory(options = {}) {
  return useMutation({ mutationFn: (variables) => createCategory(variables), ...options });
}
