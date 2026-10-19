'use client';

import { useMutation } from '@tanstack/react-query';
import { updateOrderStatus } from '../services/checkout.api.js';

/**
 * API-M05-07 — Cập nhật trạng thái đơn (Admin)
 * TanStack Query mutation khung cho PUT /api/v1/admin/orders/[id]/status.
 * TODO(API-M05-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useUpdateOrderStatus(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateOrderStatus(variables),
    ...options,
  });
}
