'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getProfile } from '../services/account.api.js';

const endpoint = getApiEndpoint('API-M01-03');

/**
 * API-M01-03 — Xem hồ sơ cá nhân
 * TanStack Query query khung cho GET /api/v1/user/profile.
 * TODO(API-M01-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetProfile(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getProfile(queryKey[1]),
    ...options,
  });
}
