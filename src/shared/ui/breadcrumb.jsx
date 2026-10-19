import Link from 'next/link';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] Breadcrumb — hỗ trợ SEO BreadcrumbList ở tầng page khi có dữ liệu thật.
 */
export default function Breadcrumb({ items = [], className }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('text-body-s', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-slate">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="text-mist">
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className="font-semibold text-ink">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors duration-250 hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
