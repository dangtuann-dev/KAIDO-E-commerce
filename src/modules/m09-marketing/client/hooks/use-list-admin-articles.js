'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminArticles } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-12');

/**
 * API-M09-12 — Danh sách bài viết (Admin)
 * GET /api/v1/admin/marketing/articles — mọi trạng thái kèm danh mục.
 */
export function useListAdminArticles(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminArticles(queryKey[1]),
    ...options,
  });
}
