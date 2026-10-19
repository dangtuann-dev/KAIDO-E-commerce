'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { BUSINESS_RULES } from '@/shared/constants/business-rules.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import { useAuthStore, selectAuthUser } from '@/shared/auth/auth-store.js';
import { AuthModal } from '@/modules/m01-account/public.client.js';
import { MegaMenuCategory } from '@/modules/m02-catalog/public.client.js';
import { SearchBar } from '@/modules/m03-search/public.client.js';
import { CartBadge, MiniCartDrawer } from '@/modules/m04-cart/public.client.js';

const PRIMARY_NAV = [
  { href: '/products', label: 'Sản phẩm' },
  { href: '/promotions', label: 'Khuyến mãi' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'Hỗ trợ' },
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
 * Blueprint §3.9. AuthModal, MegaMenuCategory, SearchBar, CartBadge và
 * MiniCartDrawer được import qua public.client.js của module sở hữu.
 */
export default function SiteHeader() {
  const [topbarVisible, setTopbarVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const user = useAuthStore(selectAuthUser);

  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const freeShipThreshold = formatVND(BUSINESS_RULES.SHIPPING.FREE_SHIPPING_THRESHOLD_VND);
  const accountLabel = user?.full_name?.trim() || 'Tài khoản';

  return (
    <>
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
              <MegaMenuCategory />
              {PRIMARY_NAV.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            <SearchBar
              id="site-search"
              className="ml-auto hidden w-full max-w-sm flex-1 md:block"
            />

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              {user ? (
                <Link
                  href="/account/profile"
                  className="hidden min-h-[44px] max-w-[180px] items-center gap-2 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary sm:inline-flex"
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
                  <span className="truncate">{accountLabel}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
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
                </button>
              )}

              <CartBadge onClick={() => setCartOpen(true)} />
            </div>
          </div>

          {mobileOpen ? (
            <div id="mobile-navigation" className="border-t border-fog bg-white lg:hidden">
              <div className="kaido-container py-3">
                <SearchBar
                  id="mobile-search"
                  className="mb-3 block md:hidden"
                  onNavigate={() => setMobileOpen(false)}
                />

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
                      {user ? (
                        <NavLink
                          href="/account/profile"
                          label={accountLabel}
                          onClick={() => setMobileOpen(false)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            setAuthOpen(true);
                          }}
                          className="inline-flex min-h-[44px] w-full items-center rounded-sm px-3 text-left text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary"
                        >
                          Đăng nhập
                        </button>
                      )}
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <AuthModal open={authOpen} onClose={closeAuth} />
      <MiniCartDrawer open={cartOpen} onClose={closeCart} />
    </>
  );
}
