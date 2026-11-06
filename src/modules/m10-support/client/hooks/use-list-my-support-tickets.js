'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listMySupportTickets } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-13');

/**
 * API-M10-13 — Danh sách ticket của tôi
 * GET /api/v1/support/tickets — khách theo dõi toàn bộ yêu cầu (M10-F07).
 */
export function useListMySupportTickets(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listMySupportTickets(queryKey[1]),
    ...options,
  });
}
