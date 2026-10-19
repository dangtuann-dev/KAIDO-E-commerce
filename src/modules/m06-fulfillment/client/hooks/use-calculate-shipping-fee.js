'use client';

import { useMutation } from '@tanstack/react-query';
import { calculateShippingFee } from '../services/fulfillment.api.js';

/**
 * API-M06-01 — Tính phí vận chuyển
 * TanStack Query mutation khung cho POST /api/v1/shipping/calculate-fee.
 * TODO(API-M06-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCalculateShippingFee(options = {}) {
  return useMutation({
    mutationFn: (variables) => calculateShippingFee(variables),
    ...options,
  });
}
