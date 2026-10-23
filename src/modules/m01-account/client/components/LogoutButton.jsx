'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/auth/auth-store.js';
import { useToast } from '@/shared/ui/toast.jsx';
import { logout } from '../services/account.api.js';

export default function LogoutButton({ className = '' }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const toast = useToast();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Dù server lỗi vẫn đăng xuất phía client
    }
    clearSession();
    queryClient.clear();
    toast.success('Đã đăng xuất.');
    router.push('/');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`block w-full rounded-sm px-4 py-3 text-left text-body-s text-sale transition-colors duration-250 hover:bg-sale/5 ${className}`}
    >
      Đăng xuất
    </button>
  );
}