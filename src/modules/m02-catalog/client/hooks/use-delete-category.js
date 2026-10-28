'use client';

import { useMutation } from '@tanstack/react-query';
import { deleteCategory } from '../services/catalog.api.js';

/** API-M02-14 — Xóa mềm danh mục (chặn khi còn danh mục con/sản phẩm). */
export function useDeleteCategory(options = {}) {
  return useMutation({ mutationFn: (variables) => deleteCategory(variables), ...options });
}
