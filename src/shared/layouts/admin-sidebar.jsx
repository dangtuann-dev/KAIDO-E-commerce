'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { selectAuthUser, useAuthStore } from '@/shared/auth/auth-store.js';
import { ADMIN_SIDEBAR_MODULES } from '@/shared/rbac/permissions.js';
import { ROLE_LABELS } from '@/shared/constants/roles.js';
import { cn } from '@/shared/utils/cn.js';

const MODULE_NAV = [
  { module: 'M01', href: '/admin/users', label: 'Người dùng' },
  {
    module: 'M02',
    href: '/admin/products',
    label: 'Sản phẩm',
    children: [
      { href: '/admin/products', label: 'Danh sách sản phẩm' },
      { href: '/admin/categories', label: 'Danh mục' },
      { href: '/admin/brands', label: 'Thương hiệu' },
    ],
  },
  { module: 'M05', href: '/admin/orders', label: 'Đơn hàng' },
  { module: 'M06', href: '/admin/shipping', label: 'Giao vận' },
  {
    module: 'M08',
    href: '/admin/inventory',
    label: 'Kho & tồn kho',
    children: [
      { href: '/admin/inventory/receipts/new', label: 'Phiếu nhập kho' },
      { href: '/admin/inventory/audit', label: 'Kiểm kê' },
      { href: '/admin/inventory/stock-cards', label: 'Thẻ kho' },
    ],
  },
  { module: 'M07', href: '/admin/loyalty/vouchers', label: 'Voucher & khách thân thiết' },
  {
    module: 'M09',
    href: '/admin/marketing/banners',
    label: 'Nội dung & chiến dịch',
    children: [
      { href: '/admin/marketing/banners', label: 'Banner' },
      { href: '/admin/marketing/campaigns', label: 'Chiến dịch' },
    ],
  },
  { module: 'M03', href: '/admin/analytics/search', label: 'Thống kê tìm kiếm' },
  {
    module: 'M10',
    href: '/admin/reviews',
    label: 'Hỗ trợ & đánh giá',
    children: [
      { href: '/admin/reviews', label: 'Kiểm duyệt đánh giá' },
      { href: '/admin/support', label: 'Ticket hỗ trợ' },
    ],
  },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * [SHARED] AdminSidebar — điều hướng back-office theo module (Blueprint §3).
 * Ẩn module theo vai trò qua ADMIN_SIDEBAR_MODULES; API vẫn kiểm tra quyền thật.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore(selectAuthUser);
  const allowedModules = user?.role ? (ADMIN_SIDEBAR_MODULES[user.role] ?? []) : [];
  const visibleItems = MODULE_NAV.filter((item) => allowedModules.includes(item.module));

  return (
    <aside className="w-full shrink-0 border-b border-fog bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4">
        <Link
          href="/admin"
          className="flex items-center gap-2"
          aria-label="KAIDO Admin — tổng quan"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-sm bg-ink font-heading text-h6 text-accent"
          >
            K
          </span>
          <span>
            <span className="block font-heading text-h5 text-ink">KAIDO Admin</span>
            <span className="block text-caption text-slate">Khu vực quản trị</span>
          </span>
        </Link>

        {user ? (
          <div className="mt-4 rounded-sm bg-surface-sky/70 px-3 py-2">
            <p className="truncate text-body-s font-semibold text-ink">
              {user.full_name || 'Nhân viên KAIDO'}
            </p>
            <p className="text-caption text-slate">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Điều hướng quản trị" className="px-2 pb-4">
        <ul className="flex gap-1 overflow-x-auto pb-1 scrollbar-none lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">
          <li>
            <Link
              href="/admin"
              aria-current={pathname === '/admin' ? 'page' : undefined}
              className={cn(
                'flex min-h-[44px] items-center whitespace-nowrap rounded-sm px-3 text-body-s font-semibold transition-colors duration-250',
                pathname === '/admin' ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-fog/60',
              )}
            >
              Tổng quan
            </Link>
          </li>
          {visibleItems.map((item) => (
            <li key={item.module}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-sm px-3 text-body-s font-semibold transition-colors duration-250',
                  isActive(pathname, item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink hover:bg-fog/60',
                )}
              >
                <span className="text-caption font-normal text-mist">{item.module}</span>
                {item.label}
              </Link>
              {item.children ? (
                <ul className="ml-3 hidden border-l border-fog pl-2 lg:block">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        aria-current={pathname === child.href ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[36px] items-center rounded-sm px-2 text-body-s transition-colors duration-250',
                          pathname === child.href
                            ? 'text-primary'
                            : 'text-slate hover:bg-fog/50 hover:text-ink',
                        )}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
