'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listArticles } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-06');

/**
 * API-M09-06 — Danh sách bài viết công khai
 * GET /api/v1/content/articles — phân trang, lọc theo slug danh mục.
 */
export function useListArticles(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listArticles(queryKey[1]),
    staleTime: 60_000,
    ...options,
  });
}
