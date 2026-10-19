import Link from 'next/link';
import RoleRoute from '@/shared/auth/role-route.jsx';
import AdminSidebar from '@/shared/layouts/admin-sidebar.jsx';
import { ADMIN_SIDEBAR_MODULES } from '@/shared/rbac/permissions.js';

const ADMIN_PANEL_ROLES = Object.freeze(Object.keys(ADMIN_SIDEBAR_MODULES));

/**
 * [APP] Admin layout — sidebar theo module + kiểm tra vai trò phía client.
 * Middleware chặn thô; API kiểm tra quyền thật theo BR-M01-05.
 */
export default function AdminLayout({ children }) {
  return (
    <RoleRoute roles={ADMIN_PANEL_ROLES}>
      <div className="min-h-screen bg-surface-sky/20 lg:flex">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-fog bg-white">
            <div className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
              <p className="font-heading text-h5 text-ink">Bảng điều khiển</p>
              <div className="flex items-center gap-3 text-body-s">
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center rounded-sm px-2 font-semibold text-slate transition-colors duration-250 hover:text-primary"
                >
                  Về cửa hàng
                </Link>
                {/* TODO(M01-F07): menu người dùng, đăng xuất khi M01 hoàn thiện. */}
              </div>
            </div>
          </header>
          <main id="main-content" className="flex-1 px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </RoleRoute>
  );
}
