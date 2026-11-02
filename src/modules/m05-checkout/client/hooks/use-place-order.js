'use client';

import { useMutation } from '@tanstack/react-query';
import { placeOrder } from '../services/checkout.api.js';

/**
 * API-M05-02 — Đặt hàng (M05-F06).
 * Trả về order_code + payment_url (nếu thanh toán online) + redirect_path cho COD.
 *
 * @param {{ onSuccess?: (data: object) => void }} [options]
 */
export function usePlaceOrder(options = {}) {
  return useMutation({
    mutationFn: (variables) => placeOrder(variables),
    ...options,
  });
}
