'use client';

import { useMutation } from '@tanstack/react-query';
import { fulfillStock } from '../services/inventory.api.js';

/**
 * API-M08-04 — Xuất kho thực tế
 * TanStack Query mutation khung cho POST /api/v1/inventory/fulfill.
 * TODO(API-M08-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useFulfillStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => fulfillStock(variables),
    ...options,
  });
}
