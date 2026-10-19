'use client';

import { useMutation } from '@tanstack/react-query';
import { createFulfillment } from '../services/fulfillment.api.js';

/**
 * API-M06-02 — Tạo vận đơn & bàn giao ĐVVC
 * TanStack Query mutation khung cho POST /api/v1/orders/[orderRef]/fulfillment.
 * TODO(API-M06-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateFulfillment(options = {}) {
  return useMutation({
    mutationFn: (variables) => createFulfillment(variables),
    ...options,
  });
}
