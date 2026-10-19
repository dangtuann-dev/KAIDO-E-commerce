'use client';

import { useMutation } from '@tanstack/react-query';
import { createBanner } from '../services/marketing.api.js';

/**
 * API-M09-04 — Tạo banner (Admin)
 * TanStack Query mutation khung cho POST /api/v1/admin/marketing/banners.
 * TODO(API-M09-04): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateBanner(options = {}) {
  return useMutation({
    mutationFn: (variables) => createBanner(variables),
    ...options,
  });
}
