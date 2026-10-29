'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getCart } from '../services/cart.api.js';

const endpoint = getApiEndpoint('API-M04-01');

/**
 * API-M04-01 — Xem giỏ hàng
 * TanStack Query query cho GET /api/v1/cart.
 * Mỗi lần gọi server đều so lại giá + tồn kho (M04-F09); `variables` nhận
 * `{ query: { revalidate, selected_item_ids } }`.
 */
export function useGetCart(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getCart(queryKey[1]),
    ...options,
  });
}
