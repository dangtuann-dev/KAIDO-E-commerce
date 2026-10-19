'use client';

import { useMutation } from '@tanstack/react-query';
import { createGoodsReceipt } from '../services/inventory.api.js';

/**
 * API-M08-05 — Tạo phiếu nhập kho (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/inventory/goods-receipt.
 * TODO(API-M08-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateGoodsReceipt(options = {}) {
  return useMutation({
    mutationFn: (variables) => createGoodsReceipt(variables),
    ...options,
  });
}
