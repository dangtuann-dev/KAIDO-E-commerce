'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getBanners } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-01');

/**
 * API-M09-01 — Banner theo vị trí
 * GET /api/v1/content/banners — banner PUBLISHED, còn hiệu lực, tối đa 5 HOME_HERO.
 */
export function useGetBanners(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getBanners(queryKey[1]),
    staleTime: 60_000,
    ...options,
  });
}
