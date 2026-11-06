'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listProductReviews } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-01');

/**
 * API-M10-01 — Danh sách đánh giá sản phẩm
 * GET /api/v1/products/[idOrSlug]/reviews — 10 đánh giá/trang kèm phân bố sao.
 */
export function useListProductReviews(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listProductReviews(queryKey[1]),
    ...options,
  });
}
