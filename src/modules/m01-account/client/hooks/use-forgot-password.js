'use client';

import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../services/account.api.js';

/**
 * API-M01-06 — Quên mật khẩu
 * TanStack Query mutation khung cho POST /api/v1/auth/forgot-password.
 * TODO(API-M01-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useForgotPassword(options = {}) {
  return useMutation({
    mutationFn: (variables) => forgotPassword(variables),
    ...options,
  });
}
