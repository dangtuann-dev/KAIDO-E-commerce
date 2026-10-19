'use client';

/**
 * [TOY-M04] Giỏ hàng — CartBadge
 * SRS: M04-F02, API-M04-01
 * Route: Toàn site — Header
 * UI: Icon giỏ hàng kèm số lượng, mở MiniCartDrawer; ẩn badge khi giỏ rỗng.
 */
import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';
import { useGetCart } from '../hooks/use-get-cart.js';

export default function CartBadge({ onClick, href = '/cart', className }) {
  const { data } = useGetCart({}, { retry: false, staleTime: 30_000 });
  const totalItems = Number(data?.total_items ?? 0);
  const count = Number.isFinite(totalItems) && totalItems > 0 ? totalItems : 0;
  const label = count > 0 ? `Giỏ hàng, ${count} sản phẩm` : 'Giỏ hàng';

  const content = (
    <>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
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
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 inline-flex min-w-[20px] items-center justify-center rounded-full bg-sale px-1 text-[11px] font-bold leading-5 text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    'relative inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink transition-colors duration-250 hover:bg-fog/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={label} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} aria-label={label} className={classes}>
      {content}
    </Link>
  );
}
