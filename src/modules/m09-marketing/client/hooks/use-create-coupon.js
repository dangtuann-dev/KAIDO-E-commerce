'use client';

import { useMutation } from '@tanstack/react-query';
import { createCoupon } from '../services/marketing.api.js';

/**
 * API-M09-05 — Tạo coupon chiến dịch (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/marketing/coupons.
 * TODO(API-M09-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateCoupon(options = {}) {
  return useMutation({
    mutationFn: (variables) => createCoupon(variables),
    ...options,
  });
}
