'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getSupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-04');

/**
 * API-M10-04 — Chi tiết ticket
 * TanStack Query query khung cho GET /api/v1/support/tickets/[ticketRef].
 * TODO(API-M10-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useGetSupportTicket(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getSupportTicket(queryKey[1]),
    ...options,
  });
}
