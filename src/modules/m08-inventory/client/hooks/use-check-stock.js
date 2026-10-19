'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { checkStock } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-01');

/**
 * API-M08-01 — Kiểm tra tồn kho
 * TanStack Query query khung cho GET /api/v1/inventory/stock-check.
 * TODO(API-M08-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCheckStock(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => checkStock(queryKey[1]),
    ...options,
  });
}
