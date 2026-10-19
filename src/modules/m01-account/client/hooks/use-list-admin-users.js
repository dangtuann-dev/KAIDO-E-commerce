'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminUsers } from '../services/account.api.js';

const endpoint = getApiEndpoint('API-M01-07');

/**
 * API-M01-07 — Danh sách người dùng (Admin)
 * TanStack Query query khung cho GET /api/v1/admin/users.
 * TODO(API-M01-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListAdminUsers(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminUsers(queryKey[1]),
    ...options,
  });
}
