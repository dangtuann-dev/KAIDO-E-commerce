'use client';

import { useMutation } from '@tanstack/react-query';
import { createSupportTicket } from '../services/support.api.js';

/**
 * API-M10-03 — Tạo ticket hỗ trợ
 * TanStack Query mutation khung cho POST /api/v1/support/tickets.
 * TODO(API-M10-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateSupportTicket(options = {}) {
  return useMutation({
    mutationFn: (variables) => createSupportTicket(variables),
    ...options,
  });
}
