'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — MegaMenuCategory
 * SRS: M02-F01, API-M02-01
 * Route: Toàn site — Header
 * UI: Dropdown cây danh mục nhiều cấp, hỗ trợ bàn phím và đóng khi chọn.
 */
import { useRef } from 'react';
import Link from 'next/link';
import { useGetCategoryTree } from '../hooks/use-get-category-tree.js';

const DEMO_CATEGORIES = [
  { id: 'demo-1', name: 'Bộ lắp ráp', slug: 'bo-lap-rap', children: [] },
  { id: 'demo-2', name: 'Đồ chơi điều khiển', slug: 'do-choi-dieu-khien', children: [] },
  { id: 'demo-3', name: 'Đồ chơi giáo dục', slug: 'do-choi-giao-duc', children: [] },
  {
    id: 'demo-4',
    name: 'Đồ chơi thân thiện môi trường',
    slug: 'do-choi-than-thien-moi-truong',
    children: [],
  },
  { id: 'demo-5', name: 'Thú bông', slug: 'thu-bong', children: [] },
];

function normalizeCategories(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export default function MegaMenuCategory({ className, onNavigate }) {
  const detailsRef = useRef(null);
  const { data, isError } = useGetCategoryTree({}, { retry: false, staleTime: 5 * 60_000 });

  const categories = normalizeCategories(data);
  const usingDemo = categories.length === 0;
  const items = usingDemo ? DEMO_CATEGORIES : categories;

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

      <div className="absolute left-0 top-full z-50 w-80 rounded-md border border-fog bg-white p-2 shadow-lift">
        <ul>
          {items.map((category) => {
            const children = Array.isArray(category.children) ? category.children : [];
            return (
              <li key={category.id ?? category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  onClick={closeMenu}
                  className="flex min-h-[40px] items-center gap-2 rounded-sm px-3 text-body-s font-semibold text-ink transition-colors duration-250 hover:bg-surface-sky hover:text-primary"
                >
                  {category.icon ? (
                    <span aria-hidden="true" className="text-base">
                      {category.icon}
                    </span>
                  ) : null}
                  {category.name}
                </Link>

                {children.length > 0 ? (
                  <ul className="mb-1 ml-4 border-l border-fog pl-2">
                    {children.map((child) => (
                      <li key={child.id ?? child.slug}>
                        <Link
                          href={`/category/${child.slug}`}
                          onClick={closeMenu}
                          className="flex min-h-[36px] items-center rounded-sm px-3 text-body-s text-slate transition-colors duration-250 hover:bg-surface-sky hover:text-primary"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        {usingDemo ? (
          <p className="px-3 pb-2 pt-1 text-caption text-mist">
            {isError
              ? 'Chưa tải được danh mục từ API-M02-01 — đang hiển thị dữ liệu demo.'
              : 'Danh mục demo — chờ API-M02-01.'}
          </p>
        ) : null}
      </div>
    </details>
  );
}
