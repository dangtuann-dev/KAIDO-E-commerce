'use client';

import { useMutation } from '@tanstack/react-query';
import { verifyCoupon } from '../services/marketing.api.js';

/**
 * API-M09-03 — Xác thực coupon
 * TanStack Query mutation khung cho POST /api/v1/promotions/verify-coupon.
 * TODO(API-M09-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useVerifyCoupon(options = {}) {
  return useMutation({
    mutationFn: (variables) => verifyCoupon(variables),
    ...options,
  });
}
