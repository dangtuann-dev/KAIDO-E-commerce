'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { GuestCartMerger } from '@/modules/m04-cart/public.client.js';
import SessionBootstrap from '@/shared/auth/session-bootstrap.jsx';
import { ToastProvider } from '@/shared/ui/toast.jsx';

/**
 * [APP] Providers phía client — TanStack Query + Toast (Giai đoạn 6).
 * QueryClient tạo trong useState để không chia sẻ cache giữa các request SSR.
 * GuestCartMerger lắng nghe phiên đăng nhập để gộp giỏ khách (M04-F08).
 */
export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      <ToastProvider>
        <GuestCartMerger />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
