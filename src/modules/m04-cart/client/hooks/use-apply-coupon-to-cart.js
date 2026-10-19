'use client';

import { useMutation } from '@tanstack/react-query';
import { applyCouponToCart } from '../services/cart.api.js';

/**
 * API-M04-07 — Áp mã giảm giá vào giỏ
 * TanStack Query mutation khung cho POST /api/v1/cart/apply-coupon.
 * TODO(API-M04-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useApplyCouponToCart(options = {}) {
  return useMutation({
    mutationFn: (variables) => applyCouponToCart(variables),
    ...options,
  });
}
