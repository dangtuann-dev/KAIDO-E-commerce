'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminOrders } from '../services/checkout.api.js';

const endpoint = getApiEndpoint('API-M05-06');

/**
 * API-M05-06 — Danh sách đơn (Admin)
 * TanStack Query query khung cho GET /api/v1/admin/orders.
 * TODO(API-M05-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListAdminOrders(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminOrders(queryKey[1]),
    ...options,
  });
}
