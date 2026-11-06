'use client';

/**
 * [TOY-M06] Đơn hàng và giao vận — AdminShippingPage
 * SRS: M06-F10, M06-F11, M06-F12, M06-F14
 * Route: /admin/shipping
 * Render: Client Component. Thống kê giao hàng, vận đơn và duyệt đổi trả.
 */
import Link from 'next/link';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { hasRole } from '@/shared/constants/roles.js';
import DeliveryDashboard from '../components/DeliveryDashboard.jsx';

export default function AdminShippingPage() {
  const user = useAuthStore(selectAuthUser);
  // Quản lý đơn hàng (M05) chỉ dành cho ADMIN/STAFF; kho chỉ vào M06.
  const canManageOrders = hasRole(user?.role, ['ADMIN', 'STAFF']);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-h2 text-ink">Giao vận</h1>
          <p className="mt-1 text-body-s text-slate">
            Theo dõi vận đơn theo đơn vị vận chuyển, tỷ lệ giao thành công và xử lý yêu cầu đổi trả
            (M06-F14).
          </p>
        </div>
        {canManageOrders ? (
          <Link
            href="/admin/orders"
            className="text-body-s font-semibold text-primary hover:underline"
          >
            Quản lý đơn hàng
          </Link>
        ) : null}
      </header>

      <div className="mt-6">
        <DeliveryDashboard />
      </div>
    </div>
  );
}
