'use client';

import { create } from 'zustand';
import { clearAccessToken, setAccessToken } from '@/shared/lib/http.js';

/**
 * [SHARED] Trạng thái phiên đăng nhập phía client — chỉ giữ trong bộ nhớ.
 * Access token nằm trong src/shared/lib/http.js; refresh token là cookie HttpOnly.
 * SessionBootstrap gọi POST /api/v1/auth/refresh khi tải trang để dựng lại phiên
 * và chuyển status từ 'loading' sang 'authenticated'/'anonymous'.
 */
export const useAuthStore = create((set) => ({
  /** @type {{ id: string, email: string | null, full_name: string, phone: string | null, role: string } | null} */
  user: null,
  /** @type {'anonymous' | 'authenticated' | 'loading'} */
  status: 'loading',

  /**
   * @param {{ user: object | null, accessToken?: string | null }} session
   */
  setSession: ({ user, accessToken: token }) => {
    if (token) setAccessToken(token);
    set({ user: user ?? null, status: user ? 'authenticated' : 'anonymous' });
  },

  /** @param {object | null} user */
  setUser: (user) => {
    set({ user: user ?? null, status: user ? 'authenticated' : 'anonymous' });
  },

  clearSession: () => {
    clearAccessToken();
    set({ user: null, status: 'anonymous' });
  },
}));

export const selectAuthUser = (state) => state.user;
export const selectAuthStatus = (state) => state.status;
