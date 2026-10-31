'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getOrderDetail } from '../services/checkout.api.js';

const endpoint = getApiEndpoint('API-M05-03');

/**
 * API-M05-03 — Chi tiết đơn hàng (M05-F10).
 * Truyền `refetchInterval` (ms) để poll trạng thái thanh toán online (M05-F08).
 *
 * @param {{ orderRef?: string }} variables
 * @param {{ enabled?: boolean, refetchInterval?: number | false }} [options]
 */
export function useGetOrderDetail(variables = {}, options = {}) {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getOrderDetail(queryKey[1]),
    enabled: enabled && Boolean(variables?.orderRef),
    retry: false,
    ...rest,
  });
}
