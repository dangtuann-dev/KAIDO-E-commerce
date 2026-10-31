'use client';

import { useMutation } from '@tanstack/react-query';
import { vnpayIpn } from '../services/checkout.api.js';

/**
 * API-M05-04 — VNPAY IPN.
 * Chỉ trang mô phỏng thanh toán (dev) gọi hook này để giả lập cổng gọi IPN;
 * production do VNPAY gọi trực tiếp vào route server.
 *
 * @param {{ onSuccess?: (data: object) => void }} [options]
 */
export function useVnpayIpn(options = {}) {
  return useMutation({
    mutationFn: (variables) => vnpayIpn(variables),
    ...options,
  });
}
