'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminReviews } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-12');

/**
 * API-M10-12 — Danh sách đánh giá (Admin)
 * GET /api/v1/admin/reviews — hàng chờ kiểm duyệt, lọc trạng thái/số sao/sản phẩm.
 */
export function useListAdminReviews(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminReviews(queryKey[1]),
    ...options,
  });
}
