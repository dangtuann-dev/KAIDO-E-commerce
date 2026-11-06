'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminSupportTickets } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-14');

/**
 * API-M10-14 — Hàng đợi ticket (Admin)
 * GET /api/v1/admin/support/tickets — lọc trạng thái/ưu tiên/người xử lý (M10-F08).
 */
export function useListAdminSupportTickets(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminSupportTickets(queryKey[1]),
    ...options,
  });
}
