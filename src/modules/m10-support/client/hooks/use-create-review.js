'use client';

import { useMutation } from '@tanstack/react-query';
import { createReview } from '../services/support.api.js';

/**
 * API-M10-02 — Gửi đánh giá
 * TanStack Query mutation khung cho POST /api/v1/products/[idOrSlug]/reviews.
 * TODO(API-M10-02): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useCreateReview(options = {}) {
  return useMutation({
    mutationFn: (variables) => createReview(variables),
    ...options,
  });
}
