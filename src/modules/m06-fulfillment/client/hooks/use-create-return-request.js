'use client';

import { useMutation } from '@tanstack/react-query';
import { createReturnRequest } from '../services/fulfillment.api.js';

/**
 * API-M06-06 — Yêu cầu đổi trả
 * TanStack Query mutation khung cho POST /api/v1/orders/[orderRef]/returns.
 * TODO(API-M06-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateReturnRequest(options = {}) {
  return useMutation({
    mutationFn: (variables) => createReturnRequest(variables),
    ...options,
  });
}
