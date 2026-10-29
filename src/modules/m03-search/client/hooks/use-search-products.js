'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { searchProducts } from '../services/search.api.js';

const endpoint = getApiEndpoint('API-M03-01');

/**
 * API-M03-01 — Tìm kiếm sản phẩm
 * TanStack Query cho GET /api/v1/search/products.
 */
export function useSearchProducts(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => searchProducts(queryKey[1]),
    ...options,
  });
}
