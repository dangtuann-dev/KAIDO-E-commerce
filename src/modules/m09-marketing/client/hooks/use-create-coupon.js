'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createCoupon } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-05');
const listCode = getApiEndpoint('API-M09-21').code;
const publicCode = getApiEndpoint('API-M09-08').code;

/**
 * API-M09-05 — Tạo coupon chiến dịch (Admin)
 * POST /api/v1/admin/marketing/coupons — 409 khi mã đã tồn tại.
 */
export function useCreateCoupon(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createCoupon(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
