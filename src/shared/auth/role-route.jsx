'use client';

import Link from 'next/link';
import { selectAuthStatus, selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import ProtectedRoute from '@/shared/auth/protected-route.jsx';
import { ROLE_LABELS, hasRole } from '@/shared/constants/roles.js';
import EmptyState from '@/shared/ui/empty-state.jsx';

/**
 * [SHARED] RoleRoute — kiểm tra vai trò phía client (ma trận RBAC SRS §2.2).
 * API vẫn là nơi phân quyền thật; đây chỉ là lớp bảo vệ điều hướng.
 */
export default function RoleRoute({ roles = [], children }) {
  const status = useAuthStore(selectAuthStatus);
  const user = useAuthStore(selectAuthUser);

  if (status !== 'authenticated') {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  if (!hasRole(user?.role, roles)) {
    return (
      <div className="kaido-container py-16">
        <EmptyState
          title="Không có quyền truy cập"
          description={`Tài khoản ${
            user?.role ? `(${ROLE_LABELS[user.role] ?? user.role})` : ''
          } không được phép vào khu vực này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.`}
          action={
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-sm border border-fog px-5 text-body-s font-semibold text-ink transition-colors duration-250 hover:border-primary hover:text-primary"
            >
              Về trang chủ
            </Link>
          }
        />
      </div>
    );
  }

  return children;
}
