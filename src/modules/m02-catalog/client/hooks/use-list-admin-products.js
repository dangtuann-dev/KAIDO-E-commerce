'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminProducts } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-08');

/** API-M02-08 — Danh sách sản phẩm cho back-office. */
export function useListAdminProducts(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminProducts(queryKey[1]),
    ...options,
  });
}
