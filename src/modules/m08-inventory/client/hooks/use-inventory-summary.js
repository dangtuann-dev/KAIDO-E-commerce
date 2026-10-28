'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getInventorySummary } from '../services/inventory.api.js';

const endpoint = getApiEndpoint('API-M08-23');

/** API-M08-23 — Số liệu tổng quan tồn kho. */
export function useInventorySummary(options = {}) {
  return useQuery({
    queryKey: [endpoint.code],
    queryFn: () => getInventorySummary(),
    ...options,
  });
}
