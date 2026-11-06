'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { replyToReview } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-11');
const adminReviewsCode = getApiEndpoint('API-M10-12').code;
const productReviewsCode = getApiEndpoint('API-M10-01').code;

/**
 * API-M10-11 — Cửa hàng phản hồi đánh giá (Admin)
 * POST /api/v1/admin/reviews/[id]/reply — mỗi đánh giá một phản hồi công khai (M10-F05).
 */
export function useReplyToReview(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => replyToReview(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [productReviewsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
