'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getSearchStatistics } from '../services/search.api.js';

const endpoint = getApiEndpoint('API-M03-04');

/**
 * API-M03-04 — Thống kê tìm kiếm (Admin)
 * TanStack Query cho GET /api/v1/search/statistics.
 */
export function useGetSearchStatistics(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getSearchStatistics(queryKey[1]),
    ...options,
  });
}
