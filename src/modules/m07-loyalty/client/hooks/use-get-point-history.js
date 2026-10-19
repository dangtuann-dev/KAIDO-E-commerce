'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getPointHistory } from '../services/loyalty.api.js';

const endpoint = getApiEndpoint('API-M07-03');

/**
 * API-M07-03 — Lịch sử điểm thưởng
 * TanStack Query query khung cho GET /api/v1/loyalty/point-history.
 * TODO(API-M07-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetPointHistory(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getPointHistory(queryKey[1]),
    ...options,
  });
}
