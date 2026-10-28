'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminBrands } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-15');

/** API-M02-15 — Danh sách thương hiệu cho back-office. */
export function useListAdminBrands(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: () => listAdminBrands(variables),
    staleTime: 60_000,
    ...options,
  });
}
