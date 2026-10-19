'use client';

import { useMutation } from '@tanstack/react-query';
import { reserveStock } from '../services/inventory.api.js';

/**
 * API-M08-02 — Giữ tồn kho
 * TanStack Query mutation khung cho POST /api/v1/inventory/reserve.
 * TODO(API-M08-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useReserveStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => reserveStock(variables),
    ...options,
  });
}
