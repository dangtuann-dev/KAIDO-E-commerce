'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { deleteFaq } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-21');
const adminFaqsCode = getApiEndpoint('API-M10-18').code;
const publicFaqsCode = getApiEndpoint('API-M10-06').code;
const categoriesCode = getApiEndpoint('API-M10-22').code;

/**
 * API-M10-21 — Ẩn FAQ (Admin)
 * DELETE /api/v1/admin/support/faqs/[id] — xóa mềm, ngừng hiển thị công khai (M10-F09).
 */
export function useDeleteFaq(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => deleteFaq(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [publicFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [categoriesCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
