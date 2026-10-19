'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listProducts } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-02');

/**
 * API-M02-02 — Danh sách sản phẩm
 * TanStack Query query khung cho GET /api/v1/products.
 * TODO(API-M02-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListProducts(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listProducts(queryKey[1]),
    ...options,
  });
}
