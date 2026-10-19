'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listProductReviews } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-01');

/**
 * API-M10-01 — Danh sách đánh giá sản phẩm
 * TanStack Query query khung cho GET /api/v1/products/[idOrSlug]/reviews.
 * TODO(API-M10-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListProductReviews(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listProductReviews(queryKey[1]),
    ...options,
  });
}
