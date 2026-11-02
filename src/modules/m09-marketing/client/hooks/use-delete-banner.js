'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { deleteBanner } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-11');
const listCode = getApiEndpoint('API-M09-09').code;
const publicCode = getApiEndpoint('API-M09-01').code;

/**
 * API-M09-11 — Xóa banner (Admin)
 * DELETE /api/v1/admin/marketing/banners/[id] — xóa mềm, giải phóng suất HOME_HERO.
 */
export function useDeleteBanner(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => deleteBanner(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
