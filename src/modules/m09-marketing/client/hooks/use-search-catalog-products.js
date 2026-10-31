'use client';

import { useQuery } from '@tanstack/react-query';
import { searchCatalogProducts } from '../services/marketing.api.js';

/**
 * Bộ chọn SKU của form chiến dịch — tìm sản phẩm qua API-M02-02 (công khai).
 * Chỉ gọi khi từ khóa từ 2 ký tự để tránh tải toàn bộ danh mục.
 */
export function useSearchCatalogProducts(keyword, options = {}) {
  const term = String(keyword ?? '').trim();

  return useQuery({
    queryKey: ['API-M02-02', 'campaign-picker', term],
    queryFn: () => searchCatalogProducts({ query: { keyword: term, limit: 8 } }),
    enabled: term.length >= 2,
    staleTime: 60_000,
    ...options,
  });
}
