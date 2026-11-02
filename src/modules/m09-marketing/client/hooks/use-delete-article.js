'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { deleteArticle } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-15');
const listCode = getApiEndpoint('API-M09-12').code;
const publicCode = getApiEndpoint('API-M09-06').code;

/**
 * API-M09-15 — Xóa bài viết (Admin)
 * DELETE /api/v1/admin/marketing/articles/[id] — xóa mềm, gỡ khỏi blog công khai.
 */
export function useDeleteArticle(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => deleteArticle(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
