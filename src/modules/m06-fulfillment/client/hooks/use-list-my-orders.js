'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listMyOrders } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M05-08');

/**
 * API-M05-08 — Đơn hàng của tôi (M06-F01, F02).
 * @param {{ page?: number, limit?: number, status?: string }} variables
 * @param {{ enabled?: boolean }} [options]
 */
export function useListMyOrders(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listMyOrders({ query: queryKey[1] }),
    retry: false,
    ...options,
  });
}
