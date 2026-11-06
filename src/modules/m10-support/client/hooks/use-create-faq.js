'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createFaq } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-19');
const adminFaqsCode = getApiEndpoint('API-M10-18').code;
const publicFaqsCode = getApiEndpoint('API-M10-06').code;
const categoriesCode = getApiEndpoint('API-M10-22').code;
const dashboardCode = getApiEndpoint('API-M10-17').code;

/**
 * API-M10-19 — Tạo FAQ (Admin)
 * POST /api/v1/admin/support/faqs — câu hỏi mới hiển thị ngay khi is_active (M10-F09).
 */
export function useCreateFaq(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createFaq(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [publicFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [categoriesCode] });
      queryClient.invalidateQueries({ queryKey: [dashboardCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
