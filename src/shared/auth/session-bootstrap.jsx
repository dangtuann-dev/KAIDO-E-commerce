'use client';

import { useEffect } from 'react';
import { REFRESH_ENDPOINT } from '@/shared/lib/http.js';
import { useAuthStore } from '@/shared/auth/auth-store.js';

/**
 * [SHARED] Khôi phục phiên khi tải trang/tải lại trang — M01-F02.
 * Access token chỉ nằm trong bộ nhớ, refresh token là cookie HttpOnly; gọi
 * POST /api/v1/auth/refresh một lần cho mỗi lần tải trang để dựng lại phiên.
 */
let bootstrapPromise = null;

async function loadSession() {
  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    const data = payload?.data;
    if (!data?.access_token || !data?.user_info) return null;

    return data;
  } catch {
    return null;
  }
}

export default function SessionBootstrap() {
  useEffect(() => {
    bootstrapPromise = bootstrapPromise ?? loadSession();

    bootstrapPromise.then((data) => {
      const state = useAuthStore.getState();
      if (state.status === 'authenticated') return;

      if (data) {
        state.setSession({ user: data.user_info, accessToken: data.access_token });
      } else {
        state.clearSession();
      }
    });
  }, []);

  return null;
}
