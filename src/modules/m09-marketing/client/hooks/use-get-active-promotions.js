'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getActivePromotions } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-02');

/**
 * API-M09-02 — Chiến dịch đang chạy
 * TanStack Query query khung cho GET /api/v1/content/promotions/active.
 * TODO(API-M09-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetActivePromotions(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getActivePromotions(queryKey[1]),
    ...options,
  });
}
