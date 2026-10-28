'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listStockAdjustments } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-16');

/** API-M08-16 — Danh sách phiếu kiểm kê. */
export function useListStockAdjustments(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listStockAdjustments(queryKey[1]),
    ...options,
  });
}
