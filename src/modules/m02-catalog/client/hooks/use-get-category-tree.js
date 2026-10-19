'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getCategoryTree } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-01');

/**
 * API-M02-01 — Cây danh mục
 * TanStack Query query khung cho GET /api/v1/categories/tree.
 * TODO(API-M02-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetCategoryTree(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getCategoryTree(queryKey[1]),
    ...options,
  });
}
