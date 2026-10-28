'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listSuppliers } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-12');

/** API-M08-12 — Danh sách nhà cung cấp. */
export function useListSuppliers(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listSuppliers(queryKey[1]),
    ...options,
  });
}
