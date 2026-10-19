'use client';

import { useMutation } from '@tanstack/react-query';
import { updateProduct } from '../services/catalog.api.js';

/**
 * API-M02-05 — Cập nhật sản phẩm (Admin)
 * TanStack Query mutation khung cho PUT /api/v1/admin/products/[id].
 * TODO(API-M02-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useUpdateProduct(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateProduct(variables),
    ...options,
  });
}
