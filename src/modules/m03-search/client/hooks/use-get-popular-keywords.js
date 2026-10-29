'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getPopularKeywords } from '../services/search.api.js';

const endpoint = getApiEndpoint('API-M03-03');

/**
 * API-M03-03 — Từ khóa phổ biến
 * TanStack Query cho GET /api/v1/search/popular-keywords.
 */
export function useGetPopularKeywords(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => getPopularKeywords(queryKey[1]),
    ...options,
  });
}
