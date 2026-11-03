'use client';

import { useMutation } from '@tanstack/react-query';
import { createFulfillment } from '../services/fulfillment.api.js';

/**
 * API-M06-02 — Tạo vận đơn & bàn giao ĐVVC (M06-F09).
 * POST /api/v1/orders/[orderRef]/fulfillment · quyền: ADMIN, STAFF, WAREHOUSE_KEEPER
 */
export function useCreateFulfillment(options = {}) {
  return useMutation({
    mutationFn: (variables) => createFulfillment(variables),
    ...options,
  });
}
