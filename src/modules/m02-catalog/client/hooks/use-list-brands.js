'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listBrands } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-10');

/** API-M02-10 — Danh sách thương hiệu đang hoạt động. */
export function useListBrands(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listBrands(queryKey[1]),
    staleTime: 5 * 60_000,
    ...options,
  });
}
