'use client';

import { useMutation } from '@tanstack/react-query';
import { removeSavedItem } from '../services/cart.api.js';

/**
 * API-M04-12 — Xóa món đã lưu
 * DELETE /api/v1/cart/saved-items/[savedItemId] (M04-F10).
 */
export function useRemoveSavedItem(options = {}) {
  return useMutation({
    mutationFn: (variables) => removeSavedItem(variables),
    ...options,
  });
}
