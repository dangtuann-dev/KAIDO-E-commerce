'use client';

import { useMutation } from '@tanstack/react-query';
import { cancelOrderFromFulfillment } from '../services/fulfillment.api.js';

/**
 * API-M06-05 — Hủy đơn hàng (M06)
 * TanStack Query mutation khung cho POST /api/v1/orders/[orderRef]/cancel.
 * TODO(API-M06-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCancelOrderFromFulfillment(options = {}) {
  return useMutation({
    mutationFn: (variables) => cancelOrderFromFulfillment(variables),
    ...options,
  });
}
