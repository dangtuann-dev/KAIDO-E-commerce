'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listWarehouses } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-09');

/** API-M08-09 — Danh sách kho. */
export function useListWarehouses(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listWarehouses(queryKey[1]),
    ...options,
  });
}
