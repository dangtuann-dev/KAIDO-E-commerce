'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { changeCampaignStatus } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-20');
const listCode = getApiEndpoint('API-M09-16').code;
const detailCode = getApiEndpoint('API-M09-18').code;
const publicCode = getApiEndpoint('API-M09-02').code;

/**
 * API-M09-20 — Đổi trạng thái chiến dịch (Admin)
 * PATCH /api/v1/admin/marketing/campaigns/[id]/status — SCHEDULE|ACTIVATE|END|CANCEL|DRAFT.
 */
export function useChangeCampaignStatus(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [endpoint.code],
    ...options,
    mutationFn: (variables) => changeCampaignStatus(variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [listCode] });
      queryClient.invalidateQueries({ queryKey: [detailCode] });
      queryClient.invalidateQueries({ queryKey: [publicCode] });
      options.onSuccess?.(data, variables, context);
    },
  });
}
