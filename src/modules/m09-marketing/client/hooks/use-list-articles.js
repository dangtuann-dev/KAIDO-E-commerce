'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listArticles } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-06');

/**
 * API-M09-06 — Danh sách bài viết
 * TanStack Query query khung cho GET /api/v1/content/articles.
 * TODO(API-M09-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListArticles(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listArticles(queryKey[1]),
    ...options,
  });
}
