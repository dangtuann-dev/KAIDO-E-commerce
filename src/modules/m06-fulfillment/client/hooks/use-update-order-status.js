'use client';

import { useMutation } from '@tanstack/react-query';
import { updateOrderStatus } from '../services/fulfillment.api.js';

/**
 * API-M05-07 — Cập nhật trạng thái đơn (M06-F05, F06).
 * Chỉ gửi trạng thái nằm trong ORDER_TRANSITIONS[trạng thái hiện tại].
 */
export function useUpdateOrderStatus(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateOrderStatus(variables),
    ...options,
  });
}
