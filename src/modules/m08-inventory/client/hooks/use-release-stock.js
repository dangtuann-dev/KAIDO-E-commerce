'use client';

import { useMutation } from '@tanstack/react-query';
import { releaseStock } from '../services/inventory.api.js';

/** API-M08-03 — Giải phóng tồn kho đã giữ. */
export function useReleaseStock(options = {}) {
  return useMutation({
    mutationFn: (variables) => releaseStock(variables),
    ...options,
  });
}
