'use client';

import { useMutation } from '@tanstack/react-query';
import { validateVoucher } from '../services/loyalty.api.js';

/**
 * API-M07-01 — Kiểm tra voucher
 * TanStack Query mutation khung cho POST /api/v1/loyalty/validate-voucher.
 * TODO(API-M07-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useValidateVoucher(options = {}) {
  return useMutation({
    mutationFn: (variables) => validateVoucher(variables),
    ...options,
  });
}
