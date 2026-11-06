'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listFaqCategories } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-22');

/**
 * API-M10-22 — Nhóm FAQ (Admin)
 * GET /api/v1/admin/support/faq-categories — kèm số câu hỏi mỗi nhóm (M10-F09).
 */
export function useListFaqCategories(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listFaqCategories(queryKey[1]),
    ...options,
  });
}
