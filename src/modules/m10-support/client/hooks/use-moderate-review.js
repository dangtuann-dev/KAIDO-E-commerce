'use client';

import { useMutation } from '@tanstack/react-query';
import { moderateReview } from '../services/support.api.js';

/**
 * API-M10-07 — Kiểm duyệt đánh giá (Admin)
 * TanStack Query mutation khung cho PUT /api/v1/admin/reviews/[id]/moderate.
 * TODO(API-M10-07): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useModerateReview(options = {}) {
  return useMutation({
    mutationFn: (variables) => moderateReview(variables),
    ...options,
  });
}
