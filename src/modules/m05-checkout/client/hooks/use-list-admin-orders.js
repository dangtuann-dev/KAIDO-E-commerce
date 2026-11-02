'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminOrders } from '../services/checkout.api.js';

const endpoint = getApiEndpoint('API-M05-06');

/**
 * API-M05-06 — Danh sách đơn (Admin) (M05-F11).
 *
 * @param {{ page?: number, status?: string, search?: string, from_date?: string, to_date?: string }} variables
 * @param {{ enabled?: boolean }} [options]
 */
export function useListAdminOrders(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminOrders({ query: queryKey[1] }),
    retry: false,
    ...options,
  });
}
