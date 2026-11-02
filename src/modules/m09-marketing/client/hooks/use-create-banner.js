'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createBanner } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-04');
const listCode = getApiEndpoint('API-M09-09').code;
const publicCode = getApiEndpoint('API-M09-01').code;

/**
 * API-M09-04 — Tạo banner (Admin)
 * POST /api/v1/admin/marketing/banners — 409 khi vượt 5 banner HOME_HERO (BR-M09-04).
 */
export function useCreateBanner(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createBanner(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
