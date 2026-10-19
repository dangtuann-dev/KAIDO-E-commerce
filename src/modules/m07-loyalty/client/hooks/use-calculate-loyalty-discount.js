'use client';

import { useMutation } from '@tanstack/react-query';
import { calculateLoyaltyDiscount } from '../services/loyalty.api.js';

/**
 * API-M07-04 — Tính giảm giá điểm + voucher
 * TanStack Query mutation khung cho POST /api/v1/loyalty/calculate-discount.
 * TODO(API-M07-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCalculateLoyaltyDiscount(options = {}) {
  return useMutation({
    mutationFn: (variables) => calculateLoyaltyDiscount(variables),
    ...options,
  });
}
