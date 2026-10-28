'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminCategories } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-11');

/** API-M02-11 — Cây danh mục cho back-office (gồm cả danh mục đã ẩn). */
export function useListAdminCategories(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: () => listAdminCategories(variables),
    staleTime: 60_000,
    ...options,
  });
}
