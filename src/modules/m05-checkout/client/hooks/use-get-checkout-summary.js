'use client';

import { useMutation } from '@tanstack/react-query';
import { getCheckoutSummary } from '../services/checkout.api.js';

/**
 * API-M05-01 — Tóm tắt checkout
 * TanStack Query mutation khung cho POST /api/v1/orders/checkout-summary.
 * TODO(API-M05-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetCheckoutSummary(options = {}) {
  return useMutation({
    mutationFn: (variables) => getCheckoutSummary(variables),
    ...options,
  });
}
