'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listLowStock } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-22');

/** API-M08-22 — Danh sách SKU sắp hết/hết hàng. */
export function useListLowStock(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listLowStock(queryKey[1]),
    ...options,
  });
}
