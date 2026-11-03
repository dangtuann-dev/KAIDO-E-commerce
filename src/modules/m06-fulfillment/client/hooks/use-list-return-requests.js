'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listReturnRequests } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M06-08');

/**
 * API-M06-08 — Danh sách yêu cầu đổi trả (Admin) (M06-F12).
 * @param {{ page?: number, limit?: number, status?: string, from_date?: string, to_date?: string }} variables
 * @param {{ enabled?: boolean }} [options]
 */
export function useListReturnRequests(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listReturnRequests({ query: queryKey[1] }),
    retry: false,
    ...options,
  });
}
