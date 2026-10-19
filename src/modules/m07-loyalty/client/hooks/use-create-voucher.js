'use client';

import { useMutation } from '@tanstack/react-query';
import { createVoucher } from '../services/loyalty.api.js';

/**
 * API-M07-05 — Tạo voucher (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/loyalty/vouchers.
 * TODO(API-M07-05): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateVoucher(options = {}) {
  return useMutation({
    mutationFn: (variables) => createVoucher(variables),
    ...options,
  });
}
