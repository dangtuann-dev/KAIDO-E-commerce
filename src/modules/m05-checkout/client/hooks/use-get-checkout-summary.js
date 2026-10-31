'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { getCheckoutSummary } from '../services/checkout.api.js';

const endpoint = getApiEndpoint('API-M05-01');

/**
 * API-M05-01 — Tóm tắt checkout (M05-F01, F03, F05).
 * Query tự chạy lại khi đầu vào đổi (địa chỉ, voucher, điểm) và chỉ gọi API
 * khi đã có danh sách dòng hàng đã chọn.
 *
 * @param {{ item_ids?: string[], address_id?: string, shipping_address?: object, coupon_code?: string, points_redeemed?: number }} input
 * @param {{ enabled?: boolean }} [options]
 */
export function useGetCheckoutSummary(input = {}, options = {}) {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: [endpoint.code, input],
    queryFn: ({ queryKey }) => getCheckoutSummary({ body: queryKey[1] }),
    enabled: enabled && Array.isArray(input.item_ids) && input.item_ids.length > 0,
    retry: false,
    staleTime: 0,
    ...rest,
  });
}
