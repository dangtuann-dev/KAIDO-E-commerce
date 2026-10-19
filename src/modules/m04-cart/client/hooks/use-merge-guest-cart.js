'use client';

import { useMutation } from '@tanstack/react-query';
import { mergeGuestCart } from '../services/cart.api.js';

/**
 * API-M04-06 — Gộp giỏ khách vào thành viên
 * TanStack Query mutation khung cho POST /api/v1/cart/merge.
 * TODO(API-M04-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useMergeGuestCart(options = {}) {
  return useMutation({
    mutationFn: (variables) => mergeGuestCart(variables),
    ...options,
  });
}
