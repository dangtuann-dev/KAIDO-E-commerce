'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { deleteCoupon } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-23');
const listCode = getApiEndpoint('API-M09-21').code;
const publicCode = getApiEndpoint('API-M09-08').code;

/**
 * API-M09-23 — Ngừng coupon (Admin)
 * DELETE /api/v1/admin/marketing/coupons/[id] — xóa mềm, ngừng áp dụng ngay.
 */
export function useDeleteCoupon(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => deleteCoupon(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
