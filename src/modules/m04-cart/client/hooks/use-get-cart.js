'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getCart } from '../services/cart.api.js';

const endpoint = getApiEndpoint('API-M04-01');

/**
 * API-M04-01 — Xem giỏ hàng
 * TanStack Query query khung cho GET /api/v1/cart.
 * TODO(API-M04-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetCart(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getCart(queryKey[1]),
    ...options,
  });
}
