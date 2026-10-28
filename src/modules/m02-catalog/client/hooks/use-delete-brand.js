'use client';

import { useMutation } from '@tanstack/react-query';
import { deleteBrand } from '../services/catalog.api.js';

/** API-M02-18 — Xóa mềm thương hiệu (chặn khi còn sản phẩm). */
export function useDeleteBrand(options = {}) {
  return useMutation({ mutationFn: (variables) => deleteBrand(variables), ...options });
}
