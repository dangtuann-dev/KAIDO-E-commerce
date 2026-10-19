'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getStockCard } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-07');

/**
 * API-M08-07 — Thẻ kho (Admin)
 * TanStack Query query khung cho GET /api/v1/admin/inventory/stock-card.
 * TODO(API-M08-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetStockCard(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getStockCard(queryKey[1]),
    ...options,
  });
}
