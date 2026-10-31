'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminCoupons } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-21');

/**
 * API-M09-21 — Danh sách coupon (Admin)
 * GET /api/v1/admin/marketing/coupons — mọi trạng thái kèm lượt dùng thực tế.
 */
export function useListAdminCoupons(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminCoupons(queryKey[1]),
    ...options,
  });
}
