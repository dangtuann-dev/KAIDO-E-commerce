'use client';

import { useMutation } from '@tanstack/react-query';
import { updateOrderStatus } from '../services/checkout.api.js';

/**
 * API-M05-07 — Cập nhật trạng thái đơn (Admin) (M05-F11).
 * Chỉ gửi trạng thái nằm trong ORDER_TRANSITIONS[trạng thái hiện tại].
 *
 * @param {{ onSuccess?: (data: object) => void }} [options]
 */
export function useUpdateOrderStatus(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateOrderStatus(variables),
    ...options,
  });
}
