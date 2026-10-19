'use client';

import { useMutation } from '@tanstack/react-query';
import { updateProfile } from '../services/account.api.js';

/**
 * API-M01-04 — Cập nhật hồ sơ cá nhân
 * TanStack Query mutation khung cho PUT /api/v1/user/profile.
 * TODO(API-M01-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useUpdateProfile(options = {}) {
  return useMutation({
    mutationFn: (variables) => updateProfile(variables),
    ...options,
  });
}
