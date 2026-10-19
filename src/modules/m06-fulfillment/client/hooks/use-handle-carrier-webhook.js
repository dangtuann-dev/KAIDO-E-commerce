'use client';

import { useMutation } from '@tanstack/react-query';
import { handleCarrierWebhook } from '../services/fulfillment.api.js';

/**
 * API-M06-04 — Webhook đơn vị vận chuyển
 * TanStack Query mutation khung cho POST /api/v1/shipping/webhook/carrier.
 * TODO(API-M06-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useHandleCarrierWebhook(options = {}) {
  return useMutation({
    mutationFn: (variables) => handleCarrierWebhook(variables),
    ...options,
  });
}
