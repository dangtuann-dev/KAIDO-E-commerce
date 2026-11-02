'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getArticleBySlug } from '../services/marketing.api.js';

const endpoint = getApiEndpoint('API-M09-07');

/**
 * API-M09-07 — Chi tiết bài viết theo slug
 * GET /api/v1/content/articles/[slug] — nội dung rich text + SEO của bài đã publish.
 */
export function useGetArticle(slug, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, { slug }],
    queryFn: () => getArticleBySlug({ slug }),
    enabled: Boolean(slug),
    ...options,
  });
}
