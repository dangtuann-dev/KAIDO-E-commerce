'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateArticle } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-14');
const listCode = getApiEndpoint('API-M09-12').code;
const publicCode = getApiEndpoint('API-M09-06').code;
const detailCode = getApiEndpoint('API-M09-07').code;

/**
 * API-M09-14 — Cập nhật bài viết (Admin)
 * PUT /api/v1/admin/marketing/articles/[id] — biên tập, xuất bản, lưu trữ.
 */
export function useUpdateArticle(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateArticle(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      queryClient.invalidateQueries({ queryKey: [detailCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
