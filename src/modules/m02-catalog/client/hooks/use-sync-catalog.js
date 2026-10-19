'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { syncCatalog } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-07');

/**
 * API-M02-07 — Đồng bộ catalog nội bộ
 * TanStack Query query khung cho GET /api/v1/internal/products/catalog-sync.
 * TODO(API-M02-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useSyncCatalog(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => syncCatalog(queryKey[1]),
    ...options,
  });
}
