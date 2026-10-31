'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getAdminArticle } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-24');

/**
 * API-M09-24 — Chi tiết bài viết (Admin)
 * GET /api/v1/admin/marketing/articles/[id] — kèm nội dung để biên tập (M09-F02).
 */
export function useGetAdminArticle(id, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, id],
    queryFn: () => getAdminArticle({ id }),
    enabled: Boolean(id),
    ...options,
  });
}
