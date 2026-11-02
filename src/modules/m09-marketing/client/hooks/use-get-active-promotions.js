'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getActivePromotions } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-02');

/**
 * API-M09-02 — Chiến dịch đang chạy
 * GET /api/v1/content/promotions/active — chỉ chiến dịch trong khung hiệu lực.
 */
export function useGetActivePromotions(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getActivePromotions(queryKey[1]),
    staleTime: 60_000,
    ...options,
  });
}
