'use client';

import { useMutation } from '@tanstack/react-query';
import { approveReturnRequest } from '../services/fulfillment.api.js';

/**
 * API-M06-07 — Duyệt/từ chối yêu cầu đổi trả (M06-F12).
 * PUT /api/v1/admin/returns/[id]/approve · quyền: ADMIN, STAFF
 */
export function useApproveReturnRequest(options = {}) {
  return useMutation({
    mutationFn: (variables) => approveReturnRequest(variables),
    ...options,
  });
}
