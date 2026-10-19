'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getOrderDetail } from '../services/checkout.api.js';

const endpoint = getApiEndpoint('API-M05-03');

/**
 * API-M05-03 — Chi tiết đơn hàng
 * TanStack Query query khung cho GET /api/v1/orders/[orderRef].
 * TODO(API-M05-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetOrderDetail(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getOrderDetail(queryKey[1]),
    ...options,
  });
}
