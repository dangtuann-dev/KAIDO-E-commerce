'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { createCampaign } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-17');
const listCode = getApiEndpoint('API-M09-16').code;
const publicCode = getApiEndpoint('API-M09-02').code;

/**
 * API-M09-17 — Tạo chiến dịch (Admin)
 * POST /api/v1/admin/marketing/campaigns — trạng thái suy ra từ khung giờ.
 */
export function useCreateCampaign(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => createCampaign(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
