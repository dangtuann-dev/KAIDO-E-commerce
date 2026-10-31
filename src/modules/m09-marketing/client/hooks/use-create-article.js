'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createArticle } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-13');
const listCode = getApiEndpoint('API-M09-12').code;
const publicCode = getApiEndpoint('API-M09-06').code;

/**
 * API-M09-13 — Tạo bài viết (Admin)
 * POST /api/v1/admin/marketing/articles — slug sinh tự động nếu bỏ trống.
 */
export function useCreateArticle(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createArticle(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
