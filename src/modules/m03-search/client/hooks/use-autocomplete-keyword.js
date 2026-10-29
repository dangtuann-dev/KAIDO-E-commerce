'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { autocompleteKeyword } from '../services/search.api.js';

const endpoint = getApiEndpoint('API-M03-02');

/**
 * API-M03-02 — Gợi ý từ khóa
 * TanStack Query cho GET /api/v1/search/autocomplete.
 */
export function useAutocompleteKeyword(variables = {}, options = {}) {
  return useQuery({
    queryKey: [endpoint.code, variables],
    queryFn: ({ queryKey }) => autocompleteKeyword(queryKey[1]),
    ...options,
  });
}
