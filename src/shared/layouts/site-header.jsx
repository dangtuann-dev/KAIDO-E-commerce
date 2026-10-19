'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';

const PRIMARY_NAV = [
  { href: '/products', label: 'Sản phẩm' },
  { href: '/promotions', label: 'Khuyến mãi' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'Hỗ trợ' },
];

const DEMO_CATEGORIES = [
  { href: '/category/bo-lap-rap', label: 'Bộ lắp ráp' },
  { href: '/category/do-choi-dieu-khien', label: 'Đồ chơi điều khiển' },
  { href: '/category/do-choi-giao-duc', label: 'Đồ chơi giáo dục' },
  { href: '/category/do-choi-than-thien-moi-truong', label: 'Đồ chơi thân thiện môi trường' },
  { href: '/category/thu-bong', label: 'Thú bông' },
];

const iconClass = 'h-5 w-5';

function NavLink({ href, label, onClick }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-[44px] items-center rounded-sm px-3 text-body-s font-semibold transition-colors duration-250 hover:text-primary',
        active ? 'text-primary' : 'text-ink',
      )}
    >
      {label}
    </Link>
  );
}

/**
 * [SHARED] SiteHeader — topbar đóng được, header sticky, mega menu danh mục.
 * Blueprint §3.9. Khung: SearchBar/AuthModal/CartBadge/MiniCartDrawer sẽ được
 * nối từ public.client.js của M03, M01, M04 (Giai đoạn 7).
 */
export default function SiteHeader() {
  const [topbarVisible, setTopbarVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const freeShipThreshold = formatVND(BUSINESS_RULES.SHIPPING.FREE_SHIPPING_THRESHOLD_VND);

  return (
    <header className="sticky top-0 z-40">
      {topbarVisible ? (
        <div className="bg-primary text-white">
          <div className="kaido-container flex min-h-9 items-center justify-between gap-3 py-1.5 text-caption">
            <p className="text-center sm:text-left">
              Miễn phí vận chuyển cho đơn từ {freeShipThreshold} — M06-F08
            </p>
            <button
              type="button"
              onClick={() => setTopbarVisible(false)}
              aria-label="Đóng thanh thông báo"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors duration-250 hover:bg-white/10 hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      <div className="border-b border-fog bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="kaido-container flex min-h-[64px] items-center gap-3 py-2 md:min-h-[72px]">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink transition-colors duration-250 hover:bg-fog/60 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none">
              {mobileOpen ? (
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="KAIDO — về trang chủ"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-sm bg-primary font-heading text-h5 text-white"
            >
              K
            </span>
            <span className="font-heading text-h3 tracking-wide text-ink">
              KAIDO<span className="text-secondary">.</span>
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="ml-3 hidden items-center lg:flex">
            <details className="group relative">
              <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary [&::-webkit-details-marker]:hidden">
                Danh mục
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </summary>
              <div className="absolute left-0 top-full z-50 w-72 rounded-md border border-fog bg-white p-2 shadow-lift">
                <ul>
                  {DEMO_CATEGORIES.map((category) => (
                    <li key={category.href}>
                      <Link
                        href={category.href}
                        className="flex min-h-[40px] items-center rounded-sm px-3 text-body-s text-ink transition-colors duration-250 hover:bg-surface-sky hover:text-primary"
                      >
                        {category.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="px-3 pb-2 pt-1 text-caption text-mist">Danh mục demo — chưa chốt.</p>
              </div>
            </details>
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <form
            action="/search"
            method="get"
            role="search"
            className="ml-auto hidden max-w-sm flex-1 md:block"
          >
            <label htmlFor="site-search" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <div className="relative">
              <input
                id="site-search"
                name="keyword"
                type="search"
                placeholder="Tìm đồ chơi cho bé…"
                autoComplete="off"
                className="h-11 w-full rounded-full border border-fog bg-white pl-10 pr-4 text-body-s text-ink placeholder:text-mist focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate"
                fill="none"
              >
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/?auth=login"
              className="hidden min-h-[44px] items-center gap-2 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary sm:inline-flex"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M5 20c.8-3.2 3.5-5 7-5s6.2 1.8 7 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Đăng nhập
            </Link>
            {/* TODO(M04-F09): CartBadge + MiniCartDrawer từ m04-cart/public.client.js */}
            <Link
              href="/cart"
              aria-label="Giỏ hàng"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink transition-colors duration-250 hover:bg-fog/60 hover:text-primary"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClass} fill="none">
                <path
                  d="M4 5h2l1.6 9.2a2 2 0 0 0 2 1.7h6.9a2 2 0 0 0 2-1.6L20 8H7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.3" fill="currentColor" />
                <circle cx="17" cy="19" r="1.3" fill="currentColor" />
              </svg>
            </Link>
          </div>
        </div>

        {mobileOpen ? (
          <div id="mobile-navigation" className="border-t border-fog bg-white lg:hidden">
            <div className="kaido-container py-3">
              <form action="/search" method="get" role="search" className="mb-3 md:hidden">
                <label htmlFor="mobile-search" className="sr-only">
                  Tìm kiếm sản phẩm
                </label>
                <input
                  id="mobile-search"
                  name="keyword"
                  type="search"
                  placeholder="Tìm đồ chơi cho bé…"
                  autoComplete="off"
                  className="h-11 w-full rounded-full border border-fog bg-white px-4 text-body-s text-ink placeholder:text-mist focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </form>

              <nav aria-label="Điều hướng di động">
                <ul className="grid gap-0.5">
                  {PRIMARY_NAV.map((item) => (
                    <li key={item.href}>
                      <NavLink {...item} onClick={() => setMobileOpen(false)} />
                    </li>
                  ))}
                  <li>
                    <NavLink href="/cart" label="Giỏ hàng" onClick={() => setMobileOpen(false)} />
                  </li>
                  <li>
                    <NavLink
                      href="/?auth=login"
                      label="Đăng nhập"
                      onClick={() => setMobileOpen(false)}
                    />
                  </li>
                </ul>
              </nav>

              <div className="mt-3 border-t border-fog pt-3">
                <p className="px-3 text-caption font-semibold uppercase tracking-wide text-mist">
                  Danh mục
                </p>
                <ul className="mt-1 grid gap-0.5">
                  {DEMO_CATEGORIES.map((category) => (
                    <li key={category.href}>
                      <Link
                        href={category.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-[44px] items-center rounded-sm px-3 text-body-s text-ink transition-colors duration-250 hover:bg-surface-sky hover:text-primary"
                      >
                        {category.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
