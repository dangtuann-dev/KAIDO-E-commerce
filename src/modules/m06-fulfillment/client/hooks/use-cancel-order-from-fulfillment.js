'use client';

import { useMutation } from '@tanstack/react-query';
import { cancelOrderFromFulfillment } from '../services/fulfillment.api.js';

/**
 * API-M06-05 — Hủy đơn hàng (M06-F02).
 * POST /api/v1/orders/[orderRef]/cancel · quyền: chủ đơn hoặc nhân viên
 */
export function useCancelOrderFromFulfillment(options = {}) {
  return useMutation({
    mutationFn: (variables) => cancelOrderFromFulfillment(variables),
    ...options,
  });
}
