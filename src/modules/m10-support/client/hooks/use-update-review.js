'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateReview } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-08');
const productReviewsCode = getApiEndpoint('API-M10-01').code;
const myReviewsCode = getApiEndpoint('API-M10-10').code;

/**
 * API-M10-08 — Sửa đánh giá của tôi
 * PUT /api/v1/reviews/[id] — trong 30 ngày, quay về PENDING để duyệt lại.
 */
export function useUpdateReview(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateReview(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [productReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [myReviewsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
