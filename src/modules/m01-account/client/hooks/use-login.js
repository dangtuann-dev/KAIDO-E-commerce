'use client';

import { useMutation } from '@tanstack/react-query';
import { login } from '../services/account.api.js';

/**
 * API-M01-02 — Đăng nhập
 * TanStack Query mutation khung cho POST /api/v1/auth/login.
 * TODO(API-M01-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useLogin(options = {}) {
  return useMutation({
    mutationFn: (variables) => login(variables),
    ...options,
  });
}
