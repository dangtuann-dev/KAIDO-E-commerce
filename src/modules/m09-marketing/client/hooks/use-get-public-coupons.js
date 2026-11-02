'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getPublicCoupons } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-08');

/**
 * API-M09-08 — Voucher đang phát hành
 * GET /api/v1/content/promotions/coupons — coupon còn hiệu lực để trưng bày.
 */
export function useGetPublicCoupons(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getPublicCoupons(queryKey[1]),
    staleTime: 60_000,
    ...options,
  });
}
