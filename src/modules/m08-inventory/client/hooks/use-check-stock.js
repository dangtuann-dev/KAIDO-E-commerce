'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { checkStock } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-01');

/** API-M08-01 — Kiểm tra tồn kho theo danh sách SKU. */
export function useCheckStock(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => checkStock(queryKey[1]),
    ...options,
  });
}
