'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getAdminSupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-15');

/**
 * API-M10-15 — Chi tiết ticket (Admin)
 * GET /api/v1/admin/support/tickets/[id] — hội thoại, thông tin khách, trạng thái hợp lệ.
 */
export function useGetAdminSupportTicket(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getAdminSupportTicket(queryKey[1]),
    ...options,
  });
}
