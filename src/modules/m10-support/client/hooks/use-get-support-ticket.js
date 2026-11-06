'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getSupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-04');

/**
 * API-M10-04 — Chi tiết ticket của tôi
 * GET /api/v1/support/tickets/[ticketRef] — hội thoại đầy đủ và quyền phản hồi (M10-F07).
 */
export function useGetSupportTicket(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getSupportTicket(queryKey[1]),
    ...options,
  });
}
