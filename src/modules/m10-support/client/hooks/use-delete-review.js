'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { deleteReview } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-09');
const productReviewsCode = getApiEndpoint('API-M10-01').code;
const myReviewsCode = getApiEndpoint('API-M10-10').code;
const adminReviewsCode = getApiEndpoint('API-M10-12').code;

/**
 * API-M10-09 — Xóa đánh giá của tôi
 * DELETE /api/v1/reviews/[id] — đồng bộ lại điểm sao sản phẩm.
 */
export function useDeleteReview(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => deleteReview(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [productReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [myReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [adminReviewsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
