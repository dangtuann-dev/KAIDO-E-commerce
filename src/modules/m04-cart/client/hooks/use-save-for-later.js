'use client';

import { useMutation } from '@tanstack/react-query';
import { saveForLater } from '../services/cart.api.js';

/**
 * API-M04-10 — Để dành mua sau
 * POST /api/v1/cart/items/[itemId]/save-for-later (M04-F10).
 */
export function useSaveForLater(options = {}) {
  return useMutation({
    mutationFn: (variables) => saveForLater(variables),
    ...options,
  });
}
