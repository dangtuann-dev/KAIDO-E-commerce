'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ROLE_LABELS } from '@/shared/constants/roles.js';
import { cn } from '@/shared/utils/cn.js';

const ACCOUNT_LINKS = [
  { href: '/account/profile', label: 'Hồ sơ cá nhân' },
  { href: '/account/addresses', label: 'Sổ địa chỉ' },
  { href: '/account/security', label: 'Bảo mật tài khoản' },
  { href: '/account/orders', label: 'Đơn hàng của tôi' },
  { href: '/account/loyalty', label: 'Điểm thưởng & hạng thành viên' },
  { href: '/account/support', label: 'Yêu cầu hỗ trợ' },
];

/**
 * [SHARED] AccountSidebar — điều hướng khu vực tài khoản (M01, M06, M07, M10).
 */
export default function AccountSidebar() {
  const pathname = usePathname();
  const user = useAuthStore(selectAuthUser);

  return (
    <aside aria-label="Điều hướng tài khoản">
      <div className="rounded-md border border-fog bg-surface-mint/60 p-4">
        <p className="text-caption uppercase tracking-wide text-slate">Xin chào</p>
        <p className="mt-1 font-heading text-h5 text-ink">
          {user?.full_name || 'Thành viên KAIDO'}
        </p>
        <p className="mt-0.5 text-body-s text-slate">
          {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : 'Khách hàng'}
        </p>
      </div>

      <nav aria-label="Các trang tài khoản" className="mt-4">
        <ul className="grid gap-1">
          {ACCOUNT_LINKS.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/account/loyalty' && pathname.startsWith(`${link.href}/`));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-sm border px-3 text-body-s font-semibold transition-colors duration-250',
                    active
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-transparent text-ink hover:bg-fog/60',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
