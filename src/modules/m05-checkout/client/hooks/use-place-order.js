'use client';

import { useMutation } from '@tanstack/react-query';
import { placeOrder } from '../services/checkout.api.js';

/**
 * API-M05-02 — Đặt hàng
 * TanStack Query mutation khung cho POST /api/v1/orders.
 * TODO(API-M05-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function usePlaceOrder(options = {}) {
  return useMutation({
    mutationFn: (variables) => placeOrder(variables),
    ...options,
  });
}
