'use client';

import { useMutation } from '@tanstack/react-query';
import { createStockAdjustment } from '../services/inventory.api.js';

/**
 * API-M08-06 — Tạo phiếu điều chỉnh kiểm kê (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/inventory/adjustments.
 * TODO(API-M08-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateStockAdjustment(options = {}) {
  return useMutation({
    mutationFn: (variables) => createStockAdjustment(variables),
    ...options,
  });
}
