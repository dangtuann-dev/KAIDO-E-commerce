'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listShipments } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M06-09');

/**
 * API-M06-09 — Danh sách vận đơn & thống kê giao hàng (M06-F14).
 * @param {{ page?: number, limit?: number, status?: string, carrier_code?: string, from_date?: string, to_date?: string }} variables
 * @param {{ enabled?: boolean }} [options]
 */
export function useListShipments(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listShipments({ query: queryKey[1] }),
    retry: false,
    ...options,
  });
}
