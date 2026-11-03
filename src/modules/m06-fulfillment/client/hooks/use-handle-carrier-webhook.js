'use client';

import { useMutation } from '@tanstack/react-query';
import { handleCarrierWebhook } from '../services/fulfillment.api.js';

/**
 * API-M06-04 — Webhook đơn vị vận chuyển (M06-F10).
 * POST /api/v1/shipping/webhook/carrier · quyền: công khai (HMAC)
 */
export function useHandleCarrierWebhook(options = {}) {
  return useMutation({
    mutationFn: (variables) => handleCarrierWebhook(variables),
    ...options,
  });
}
