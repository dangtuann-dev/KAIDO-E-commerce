'use client';

import { useMutation } from '@tanstack/react-query';
import { applyCouponToCart } from '../services/cart.api.js';

/**
 * API-M04-07 — Áp mã giảm giá vào giỏ
 * TanStack Query mutation cho POST /api/v1/cart/apply-coupon.
 * Mọi xác thực mã đi qua CouponService của M09 (OPEN_DECISIONS #9).
 */
export function useApplyCouponToCart(options = {}) {
  return useMutation({
    mutationFn: (variables) => applyCouponToCart(variables),
    ...options,
  });
}
