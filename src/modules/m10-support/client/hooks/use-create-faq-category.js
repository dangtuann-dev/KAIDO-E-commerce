'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createFaqCategory } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-23');
const categoriesCode = getApiEndpoint('API-M10-22').code;
const adminFaqsCode = getApiEndpoint('API-M10-18').code;
const publicFaqsCode = getApiEndpoint('API-M10-06').code;

/**
 * API-M10-23 — Tạo nhóm FAQ (Admin)
 * POST /api/v1/admin/support/faq-categories — slug tự sinh nếu bỏ trống (M10-F09).
 */
export function useCreateFaqCategory(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createFaqCategory(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [categoriesCode] });
      queryClient.invalidateQueries({ queryKey: [adminFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [publicFaqsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
