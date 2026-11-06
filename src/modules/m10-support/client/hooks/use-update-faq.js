'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateFaq } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-20');
const adminFaqsCode = getApiEndpoint('API-M10-18').code;
const publicFaqsCode = getApiEndpoint('API-M10-06').code;

/**
 * API-M10-20 — Sửa FAQ (Admin)
 * PUT /api/v1/admin/support/faqs/[id] — nội dung hoặc bật/tắt hiển thị (M10-F09).
 */
export function useUpdateFaq(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateFaq(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [adminFaqsCode] });
      queryClient.invalidateQueries({ queryKey: [publicFaqsCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
