'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { updateCampaign } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-19');
const listCode = getApiEndpoint('API-M09-16').code;
const detailCode = getApiEndpoint('API-M09-18').code;
const publicCode = getApiEndpoint('API-M09-02').code;

/**
 * API-M09-19 — Cập nhật chiến dịch (Admin)
 * PUT /api/v1/admin/marketing/campaigns/[id] — sửa khung giờ và danh sách SKU.
 */
export function useUpdateCampaign(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => updateCampaign(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [detailCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
