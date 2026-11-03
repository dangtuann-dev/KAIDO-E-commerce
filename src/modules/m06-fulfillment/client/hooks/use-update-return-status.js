'use client';

import { useMutation } from '@tanstack/react-query';
import { updateReturnStatus } from '../services/fulfillment.api.js';

/**
 * API-M06-10 — Cập nhật trạng thái đổi trả (M06-F11, F12).
 * Chỉ nhận RECEIVED (từ APPROVED), REFUNDED (từ RECEIVED) hoặc CANCELLED (từ PENDING_APPROVAL).
 */
export function useUpdateReturnStatus(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateReturnStatus(variables),
    ...options,
  });
}
