'use client';

import { useMutation } from '@tanstack/react-query';
import { vnpayIpn } from '../services/checkout.api.js';

/**
 * API-M05-04 — VNPAY IPN
 * TanStack Query mutation khung cho POST /api/v1/payments/vnpay/ipn.
 * TODO(API-M05-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useVnpayIpn(options = {}) {
  return useMutation({
    mutationFn: (variables) => vnpayIpn(variables),
    ...options,
  });
}
