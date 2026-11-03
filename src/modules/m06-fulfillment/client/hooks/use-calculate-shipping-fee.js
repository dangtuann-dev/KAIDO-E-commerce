'use client';

import { useMutation } from '@tanstack/react-query';
import { calculateShippingFee } from '../services/fulfillment.api.js';

/**
 * API-M06-01 — Tính phí vận chuyển (M06-F08).
 * POST /api/v1/shipping/calculate-fee · quyền: công khai hoặc đăng nhập
 */
export function useCalculateShippingFee(options = {}) {
  return useMutation({
    mutationFn: (variables) => calculateShippingFee(variables),
    ...options,
  });
}
