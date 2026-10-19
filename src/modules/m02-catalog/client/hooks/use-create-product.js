'use client';

import { useMutation } from '@tanstack/react-query';
import { createProduct } from '../services/catalog.api.js';

/**
 * API-M02-04 — Tạo sản phẩm (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/products.
 * TODO(API-M02-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateProduct(options = {}) {
  return useMutation({
    mutationFn: (variables) => createProduct(variables),
    ...options,
  });
}
