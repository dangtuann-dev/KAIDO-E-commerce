'use client';

import { useMutation } from '@tanstack/react-query';
import { cancelOrder } from '../services/checkout.api.js';

/**
 * API-M05-05 — Hủy đơn hàng (M05-F09).
 * Chỉ hợp lệ với các trạng thái trong CUSTOMER_CANCELLABLE_STATUSES.
 *
 * @param {{ onSuccess?: (data: object) => void }} [options]
 */
export function useCancelOrder(options = {}) {
  return useMutation({
    mutationFn: (variables) => cancelOrder(variables),
    ...options,
  });
}
