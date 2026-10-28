'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — MegaMenuCategory
 * SRS: M02-F01, API-M02-01
 * Route: Toàn site — Header
 * UI: Dropdown cây danh mục nhiều cấp (2–3 cấp), đóng khi chọn hoặc nhấn Esc.
 */
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Spinner from '@/shared/ui/spinner.jsx';
import { useGetCategoryTree } from '../hooks/use-get-category-tree.js';

function CategoryBranch({ category, depth = 0, onNavigate }) {
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <li>
      <Link
        href={`/category/${category.slug}`}
        onClick={onNavigate}
        className={
          depth === 0
            ? 'flex min-h-[40px] items-center gap-2 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:bg-surface-sky hover:text-primary'
            : 'flex min-h-[36px] items-center rounded-sm px-3 text-body-s text-slate transition-colors duration-250 hover:bg-surface-sky hover:text-primary'
        }
      >
        {category.icon_url ? (
          <Image
            src={category.icon_url}
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 rounded-full object-cover"
          />
        ) : null}
        {category.name}
      </Link>

      {children.length > 0 && depth < 2 ? (
        <ul className="mb-1 ml-4 border-l border-fog pl-2">
          {children.map((child) => (
            <CategoryBranch
              key={child.id ?? child.slug}
              category={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function MegaMenuCategory({ className, onNavigate }) {
  const detailsRef = useRef(null);
  const { data, isPending, isError } = useGetCategoryTree(
    {},
    { retry: false, staleTime: 5 * 60_000 },
  );

  const categories = Array.isArray(data) ? data : [];

  useEffect(() => {
    function handlePointerDown(event) {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target)) details.open = false;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
    onNavigate?.();
  }

  return (
    <details ref={detailsRef} className={`group relative ${className ?? ''}`}>
      <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:text-primary [&::-webkit-details-marker]:hidden">
        Danh mục
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </summary>

      <div className="absolute left-0 top-full z-50 max-h-[70vh] w-80 overflow-y-auto rounded-md border border-fog bg-white p-2 shadow-lift">
        {isPending ? (
          <div className="flex items-center gap-2 px-3 py-4 text-body-s text-slate">
            <Spinner size="sm" label="Đang tải danh mục" />
            Đang tải danh mục…
          </div>
        ) : isError ? (
          <p className="px-3 py-4 text-body-s text-slate">
            Chưa tải được danh mục. Vui lòng thử lại sau.
          </p>
        ) : categories.length === 0 ? (
          <p className="px-3 py-4 text-body-s text-slate">Danh mục đang được cập nhật.</p>
        ) : (
          <ul>
            {categories.map((category) => (
              <CategoryBranch
                key={category.id ?? category.slug}
                category={category}
                onNavigate={closeMenu}
              />
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
