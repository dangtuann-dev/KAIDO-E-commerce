'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminCampaigns } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-16');

/**
 * API-M09-16 — Danh sách chiến dịch (Admin)
 * GET /api/v1/admin/marketing/campaigns — mọi trạng thái, kèm số SKU.
 */
export function useListAdminCampaigns(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminCampaigns(queryKey[1]),
    ...options,
  });
}
