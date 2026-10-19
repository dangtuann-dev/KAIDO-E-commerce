'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAddresses } from '../services/account.api.js';

const endpoint = getApiEndpoint('API-M01-05');

/**
 * API-M01-05 — Danh sách địa chỉ
 * TanStack Query query khung cho GET /api/v1/user/addresses.
 * TODO(API-M01-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListAddresses(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAddresses(queryKey[1]),
    ...options,
  });
}
