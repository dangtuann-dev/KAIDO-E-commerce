'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateBanner } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-10');
const listCode = getApiEndpoint('API-M09-09').code;
const publicCode = getApiEndpoint('API-M09-01').code;

/**
 * API-M09-10 — Cập nhật banner (Admin)
 * PUT /api/v1/admin/marketing/banners/[id] — sửa nội dung, thứ tự, lịch, bật/tắt.
 */
export function useUpdateBanner(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateBanner(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
