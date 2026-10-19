'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getBanners } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-01');

/**
 * API-M09-01 — Banner theo vị trí
 * TanStack Query query khung cho GET /api/v1/content/banners.
 * TODO(API-M09-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetBanners(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getBanners(queryKey[1]),
    ...options,
  });
}
