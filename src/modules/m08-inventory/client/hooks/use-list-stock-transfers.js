'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listStockTransfers } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-18');

/** API-M08-18 — Danh sách phiếu chuyển kho. */
export function useListStockTransfers(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listStockTransfers(queryKey[1]),
    ...options,
  });
}
