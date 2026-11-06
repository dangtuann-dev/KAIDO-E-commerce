'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { processSupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-16');
const adminTicketDetailCode = getApiEndpoint('API-M10-15').code;
const adminTicketsCode = getApiEndpoint('API-M10-14').code;
const myTicketsCode = getApiEndpoint('API-M10-13').code;
const dashboardCode = getApiEndpoint('API-M10-17').code;

/**
 * API-M10-16 — Xử lý ticket (Admin)
 * PUT /api/v1/admin/support/tickets/[id] — phân công/phản hồi/giải quyết/đóng/mở lại (M10-F08).
 */
export function useProcessSupportTicket(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => processSupportTicket(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminTicketDetailCode] });
      queryClient.invalidateQueries({ queryKey: [adminTicketsCode] });
      queryClient.invalidateQueries({ queryKey: [myTicketsCode] });
      queryClient.invalidateQueries({ queryKey: [dashboardCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
