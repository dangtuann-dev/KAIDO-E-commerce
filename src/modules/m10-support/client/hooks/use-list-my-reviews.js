'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listMyReviews } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-10');

/**
 * API-M10-10 — Đánh giá của tôi
 * GET /api/v1/reviews/my — kèm trạng thái duyệt để khách theo dõi (M10-F02).
 */
export function useListMyReviews(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listMyReviews(queryKey[1]),
    ...options,
  });
}
