'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateCoupon } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-22');
const listCode = getApiEndpoint('API-M09-21').code;
const publicCode = getApiEndpoint('API-M09-08').code;

/**
 * API-M09-22 — Cập nhật coupon (Admin)
 * PUT /api/v1/admin/marketing/coupons/[id] — sửa điều kiện, giới hạn, hiệu lực, bật/tắt.
 */
export function useUpdateCoupon(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateCoupon(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
