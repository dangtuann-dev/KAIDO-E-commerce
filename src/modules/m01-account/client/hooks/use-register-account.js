'use client';

import { useMutation } from '@tanstack/react-query';
import { registerAccount } from '../services/account.api.js';

/**
 * API-M01-01 — Đăng ký tài khoản
 * TanStack Query mutation khung cho POST /api/v1/auth/register.
 * TODO(API-M01-01): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useRegisterAccount(options = {}) {
  return useMutation({
    mutationFn: (variables) => registerAccount(variables),
    ...options,
  });
}
