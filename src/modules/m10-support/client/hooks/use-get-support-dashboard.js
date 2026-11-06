'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getSupportDashboard } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-17');

/**
 * API-M10-17 — Dashboard CSKH
 * GET /api/v1/admin/support/dashboard — ticket theo trạng thái, quá SLA, chờ duyệt (M10-F11).
 */
export function useGetSupportDashboard(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: () => getSupportDashboard(),
    ...options,
  });
}
