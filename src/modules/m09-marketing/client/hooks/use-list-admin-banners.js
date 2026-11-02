'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminBanners } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-09');

/**
 * API-M09-09 — Danh sách banner (Admin)
 * GET /api/v1/admin/marketing/banners — lọc vị trí/trạng thái, tìm kiếm, phân trang.
 */
export function useListAdminBanners(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminBanners(queryKey[1]),
    ...options,
  });
}
