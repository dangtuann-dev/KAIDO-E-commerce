'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { listFaqs } from '../services/support.api.js';

const endpoint = getApiEndpoint('API-M10-06');

/**
 * API-M10-06 — Câu hỏi thường gặp
 * TanStack Query query khung cho GET /api/v1/support/faqs.
 * TODO(API-M10-06): bật khi backend hoàn thiện; xử lý loading/error ở UI gọi hook.
 */
export function useListFaqs(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => listFaqs(queryKey[1]),
    ...options,
  });
}
