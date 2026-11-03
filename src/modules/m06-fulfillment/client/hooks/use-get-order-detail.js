'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getOrderDetail } from '../services/fulfillment.api.js';

const endpoint = getApiEndpoint('API-M05-03');

/**
 * API-M05-03 — Chi tiết đơn hàng cho trang tài khoản M06 (M06-F01, F03).
 * @param {{ orderRef?: string }} variables
 * @param {{ enabled?: boolean }} [options]
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
