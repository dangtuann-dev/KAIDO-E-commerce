'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { replySupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-05');
const ticketDetailCode = getApiEndpoint('API-M10-04').code;
const myTicketsCode = getApiEndpoint('API-M10-13').code;
const adminTicketsCode = getApiEndpoint('API-M10-14').code;

/**
 * API-M10-05 — Khách phản hồi ticket
 * POST /api/v1/support/tickets/[ticketRef]/reply — tự mở lại ticket đã RESOLVED (M10-F07).
 */
export function useReplySupportTicket(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => replySupportTicket(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [ticketDetailCode] });
      queryClient.invalidateQueries({ queryKey: [myTicketsCode] });
      queryClient.invalidateQueries({ queryKey: [adminTicketsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
