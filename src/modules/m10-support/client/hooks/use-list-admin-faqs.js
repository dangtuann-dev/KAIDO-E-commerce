'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listAdminFaqs } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-18');

/**
 * API-M10-18 — Danh sách FAQ (Admin)
 * GET /api/v1/admin/support/faqs — gồm cả bản nháp/đã ẩn để biên tập (M10-F09).
 */
export function useListAdminFaqs(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listAdminFaqs(queryKey[1]),
    ...options,
  });
}
