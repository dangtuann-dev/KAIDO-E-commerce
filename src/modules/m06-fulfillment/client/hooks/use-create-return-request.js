'use client';

import { useMutation } from '@tanstack/react-query';
import { createReturnRequest } from '../services/fulfillment.api.js';

/**
 * API-M06-06 — Yêu cầu đổi trả (M06-F12).
 * POST /api/v1/orders/[orderRef]/returns · quyền: chủ đơn hoặc ADMIN/STAFF
 */
export function useCreateReturnRequest(options = {}) {
  return useMutation({
    mutationFn: (variables) => createReturnRequest(variables),
    ...options,
  });
}
