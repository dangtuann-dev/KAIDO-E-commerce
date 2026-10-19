'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getMyPoints } from '../services/loyalty.api.js';

const endpoint = getApiEndpoint('API-M07-02');

/**
 * API-M07-02 — Điểm thưởng của tôi
 * TanStack Query query khung cho GET /api/v1/loyalty/my-points.
 * TODO(API-M07-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetMyPoints(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getMyPoints(queryKey[1]),
    ...options,
  });
}
