'use client';

import { useMutation } from '@tanstack/react-query';
import { restoreSavedItem } from '../services/cart.api.js';

/**
 * API-M04-11 — Khôi phục món đã lưu
 * POST /api/v1/cart/saved-items/[savedItemId]/restore (M04-F10).
 */
export function useRestoreSavedItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => restoreSavedItem(variables),
    ...options,
  });
}
