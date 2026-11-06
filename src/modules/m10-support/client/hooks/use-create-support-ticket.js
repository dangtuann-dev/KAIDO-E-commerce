'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createSupportTicket } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-03');
const myTicketsCode = getApiEndpoint('API-M10-13').code;
const adminTicketsCode = getApiEndpoint('API-M10-14').code;
const dashboardCode = getApiEndpoint('API-M10-17').code;

/**
 * API-M10-03 — Tạo ticket hỗ trợ
 * POST /api/v1/support/tickets — mã #TK-XXXXX, hạn phản hồi 24 giờ (M10-F06).
 */
export function useCreateSupportTicket(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createSupportTicket(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [myTicketsCode] });
      queryClient.invalidateQueries({ queryKey: [adminTicketsCode] });
      queryClient.invalidateQueries({ queryKey: [dashboardCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
