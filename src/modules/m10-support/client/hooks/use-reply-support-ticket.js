'use client';

import { useMutation } from '@tanstack/react-query';
import { replySupportTicket } from '../services/support.api.js';

/**
 * API-M10-05 — Phản hồi ticket
 * TanStack Query mutation khung cho POST /api/v1/support/tickets/[ticketRef]/reply.
 * TODO(API-M10-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useReplySupportTicket(options = {}) {
  return useMutation({
    mutationFn: (variables) => replySupportTicket(variables),
    ...options,
  });
}
