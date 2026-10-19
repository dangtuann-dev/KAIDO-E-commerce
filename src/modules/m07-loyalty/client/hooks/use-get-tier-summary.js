'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getTierSummary } from '../services/loyalty.api.js';

const endpoint = getApiEndpoint('API-M07-06');

/**
 * API-M07-06 — Thống kê hạng thành viên (Admin)
 * TanStack Query query khung cho GET /api/v1/admin/loyalty/tiers-summary.
 * TODO(API-M07-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetTierSummary(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getTierSummary(queryKey[1]),
    ...options,
  });
}
