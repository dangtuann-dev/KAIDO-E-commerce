'use client';

import { useMutation } from '@tanstack/react-query';
import { cancelOrder } from '../services/checkout.api.js';

/**
 * API-M05-05 — Hủy đơn hàng
 * TanStack Query mutation khung cho POST /api/v1/orders/[orderRef]/cancel.
 * TODO(API-M05-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCancelOrder(options = {}) {
  return useMutation({
    mutationFn: (variables) => cancelOrder(variables),
    ...options,
  });
}
