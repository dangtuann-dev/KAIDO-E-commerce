'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getAdminCampaign } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-18');

/**
 * API-M09-18 — Chi tiết chiến dịch (Admin)
 * GET /api/v1/admin/marketing/campaigns/[id] — kèm danh sách SKU flash sale.
 */
export function useGetAdminCampaign(id, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, { id }],
    queryFn: () => getAdminCampaign({ id }),
    enabled: Boolean(id),
    ...options,
  });
}
