'use client';

import { useMutation } from '@tanstack/react-query';
import { approveReturnRequest } from '../services/fulfillment.api.js';

/**
 * API-M06-07 — Duyệt yêu cầu đổi trả
 * TanStack Query mutation khung cho PUT /api/v1/admin/returns/[id]/approve.
 * TODO(API-M06-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useApproveReturnRequest(options = {}) {
  return useMutation({
    mutationFn: (variables) => approveReturnRequest(variables),
    ...options,
  });
}
