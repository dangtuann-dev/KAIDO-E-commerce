'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { selectAuthStatus, useAuthStore } from '@/shared/auth/auth-store.js';
import EmptyState from '@/shared/ui/empty-state.jsx';

/**
 * [SHARED] ProtectedRoute — chặn route tài khoản ở phía client.
 * Middleware chỉ kiểm tra cookie thô; quyền thật vẫn do API xác thực.
 */
export default function ProtectedRoute({ children }) {
  const status = useAuthStore(selectAuthStatus);
  const pathname = usePathname();

  if (status === 'authenticated') return children;

  const loginHref = `/?auth=login&next=${encodeURIComponent(pathname || '/account/profile')}`;

  return (
    <div className="kaido-container py-16">
      <EmptyState
        title="Bạn cần đăng nhập"
        description="Khu vực này chỉ dành cho thành viên. Đăng nhập để tiếp tục quản lý tài khoản, đơn hàng và điểm thưởng."
        action={
          <Link
            href={loginHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 text-body-s font-semibold text-white transition-colors duration-250 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Đăng nhập
          </Link>
        }
      />
    </div>
  );
}
