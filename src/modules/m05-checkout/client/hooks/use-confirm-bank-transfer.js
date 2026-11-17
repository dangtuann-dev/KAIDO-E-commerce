'use client';

import { useMutation } from '@tanstack/react-query';
import { confirmBankTransferPayment } from '../services/checkout.api.js';

/**
 * API-M05-10 — Nhân viên xác nhận đã nhận tiền chuyển khoản (M05-F07, M05-F11).
 *
 * @param {{ onSuccess?: (data: object) => void }} [options]
 */
export function useConfirmBankTransfer(options = {}) {
  return useMutation({
    mutationFn: (variables) => confirmBankTransferPayment(variables),
    ...options,
  });
}
