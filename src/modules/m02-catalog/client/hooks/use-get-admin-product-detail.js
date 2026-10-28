'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getAdminProductDetail } from '../services/catalog.api.js';

const endpoint = getApiEndpoint('API-M02-09');

/** API-M02-09 — Chi tiết sản phẩm cho back-office (kèm biến thể đã ẩn). */
export function useGetAdminProductDetail(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getAdminProductDetail(queryKey[1]),
    enabled: Boolean(variables.id),
    ...options,
  });
}
