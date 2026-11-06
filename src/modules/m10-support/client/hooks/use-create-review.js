'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createReview } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-02');
const productReviewsCode = getApiEndpoint('API-M10-01').code;
const myReviewsCode = getApiEndpoint('API-M10-10').code;

/**
 * API-M10-02 — Gửi đánh giá (Verified Purchase)
 * POST /api/v1/products/[idOrSlug]/reviews — đánh giá mới vào hàng chờ PENDING.
 */
export function useCreateReview(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createReview(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [productReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [myReviewsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
