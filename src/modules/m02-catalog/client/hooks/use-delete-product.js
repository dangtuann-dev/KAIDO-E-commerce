'use client';

import { useMutation } from '@tanstack/react-query';
import { deleteProduct } from '../services/catalog.api.js';

/**
 * API-M02-06 — Xóa mềm sản phẩm (Admin)
 * TanStack Query mutation khung cho DELETE /api/v1/admin/products/[id].
 * TODO(API-M02-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useDeleteProduct(options = {}) {
  return useMutation({
    mutationFn: (variables) => deleteProduct(variables),
    ...options,
  });
}
