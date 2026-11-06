'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { moderateReview } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-07');
const adminReviewsCode = getApiEndpoint('API-M10-12').code;
const productReviewsCode = getApiEndpoint('API-M10-01').code;
const dashboardCode = getApiEndpoint('API-M10-17').code;

/**
 * API-M10-07 — Kiểm duyệt đánh giá (Admin)
 * PUT /api/v1/admin/reviews/[id]/moderate — duyệt/từ chối/ẩn, đồng bộ rating sang M02.
 */
export function useModerateReview(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => moderateReview(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [productReviewsCode] });
      queryClient.invalidateQueries({ queryKey: [dashboardCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
