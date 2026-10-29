'use client';

/**
 * [TOY-M04] Giỏ hàng — GuestCartMerger
 * SRS: M04-F08, API: API-M04-06
 * Route: mount một lần ở src/app/providers.js (dùng chung toàn site)
 * UI: không render gì — tự gộp giỏ khách vãng lai vào giỏ thành viên ngay sau khi
 *     phiên chuyển sang 'authenticated'. Lỗi gộp không được chặn đăng nhập (M04-F08).
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { selectAuthStatus, useAuthStore } from '@/shared/auth/auth-store.js';
import { clearGuestSessionId, readGuestSessionId } from '@/shared/lib/http.js';
import { useToast } from '@/shared/ui/toast.jsx';
import { useMergeGuestCart } from '../hooks/use-merge-guest-cart.js';

const CART_QUERY_KEY = getApiEndpoint('API-M04-01').code;

export default function GuestCartMerger() {
  const status = useAuthStore(selectAuthStatus);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const queryClient = useQueryClient();
  const { success } = useToast();
  const { mutateAsync: mergeCartAsync } = useMergeGuestCart();

  // userId đã xử lý — chống gộp lặp khi effect chạy lại (StrictMode, re-render).
  const handledUserRef = useRef(null);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return undefined;
    if (handledUserRef.current === userId) return undefined;

    const guestSessionId = readGuestSessionId();
    if (!guestSessionId) {
      handledUserRef.current = userId;
      return undefined;
    }

    // Đánh dấu trước khi gọi API để một lần đăng nhập chỉ gộp đúng một lần.
    handledUserRef.current = userId;

    mergeCartAsync({ body: { guest_session_id: guestSessionId } })
      .then((result) => {
        // Giỏ khách đã chuyển MERGED phía server: xóa mã phiên để không gộp lại.
        clearGuestSessionId();
        queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });

        const mergedItems = Number(result?.merged_items ?? 0);
        if (mergedItems > 0) {
          success(result?.message ?? `Đã gộp ${mergedItems} sản phẩm vào giỏ hàng của bạn.`);
        }
      })
      .catch(() => {
        // M04-F08 không được chặn đăng nhập: giữ mã phiên để lần sau gộp lại.
        if (handledUserRef.current === userId) handledUserRef.current = null;
      });

    return undefined;
  }, [status, userId, mergeCartAsync, queryClient, success]);

  return null;
}
