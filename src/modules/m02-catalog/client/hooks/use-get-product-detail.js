'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getProductDetail } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-03');

/**
 * API-M02-03 — Chi tiết sản phẩm
 * TanStack Query query khung cho GET /api/v1/products/[idOrSlug].
 * TODO(API-M02-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetProductDetail(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getProductDetail(queryKey[1]),
    ...options,
  });
}
