'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getOrderTracking } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M06-03');

/**
 * API-M06-03 — Theo dõi vận chuyển (M06-F03).
 * @param {{ orderRef?: string }} variables
 * @param {{ enabled?: boolean, refetchInterval?: number | false }} [options]
 */
export function useGetOrderTracking(variables = {}, options = {}) {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getOrderTracking(queryKey[1]),
    enabled: enabled && Boolean(variables?.orderRef),
    retry: false,
    ...rest,
  });
}
