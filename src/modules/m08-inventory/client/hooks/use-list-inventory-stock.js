'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listInventoryStock } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-08');

/** API-M08-08 — Danh sách tồn kho theo SKU/kho. */
export function useListInventoryStock(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listInventoryStock(queryKey[1]),
    ...options,
  });
}
