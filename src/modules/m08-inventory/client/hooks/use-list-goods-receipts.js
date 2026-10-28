'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listGoodsReceipts } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-15');

/** API-M08-15 — Lịch sử phiếu nhập kho. */
export function useListGoodsReceipts(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listGoodsReceipts(queryKey[1]),
    ...options,
  });
}
