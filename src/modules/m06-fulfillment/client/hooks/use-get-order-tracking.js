'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getOrderTracking } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M06-03');

/**
 * API-M06-03 — Theo dõi vận chuyển
 * TanStack Query query khung cho GET /api/v1/orders/[orderRef]/tracking.
 * TODO(API-M06-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetOrderTracking(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getOrderTracking(queryKey[1]),
    ...options,
  });
}
