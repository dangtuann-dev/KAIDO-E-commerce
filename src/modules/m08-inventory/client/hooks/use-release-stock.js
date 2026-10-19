'use client';

import { useMutation } from '@tanstack/react-query';
import { releaseStock } from '../services/inventory.api.js';

/**
 * API-M08-03 — Giải phóng tồn kho
 * TanStack Query mutation khung cho POST /api/v1/inventory/release.
 * TODO(API-M08-03): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useReleaseStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => releaseStock(variables),
    ...options,
  });
}
