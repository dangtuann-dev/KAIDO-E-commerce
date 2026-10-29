'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SearchPage
 * SRS: M03-F01..F10 | API: API-M03-01, API-M03-02, API-M03-03
 * Route: /search
 * UI: Facet search đồng bộ URL, sắp xếp, phân trang, autocomplete ở header và trạng thái không kết quả.
 */
import { useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/shared/ui/breadcrumb.jsx';
import {
  AGE_GROUP_VALUES,
  GENDER_TARGET_VALUES,
  SORT_OPTION_VALUES,
} from '@/shared/constants/product.js';
import FilterPanel from '../components/FilterPanel.jsx';
import NoResult from '../components/NoResult.jsx';
import Pagination from '../components/Pagination.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import { useGetPopularKeywords } from '../hooks/use-get-popular-keywords.js';
import { useSearchProducts } from '../hooks/use-search-products.js';

const PAGE_SIZE = 12;
const FILTER_KEYS = [
  'category_id',
  'brand_id',
  'price_min',
  'price_max',
  'age_group',
  'gender',
  'in_stock',
  'on_sale',
];

function parseCsv(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePrice(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseFilters(searchParams) {
  const page = Number(searchParams.get('page'));
  const sort = searchParams.get('sort');

  return {
    keyword: searchParams.get('keyword')?.trim().slice(0, 100) ?? '',
    category_id: parseCsv(searchParams.get('category_id')),
    brand_id: parseCsv(searchParams.get('brand_id')),
    age_group: parseCsv(searchParams.get('age_group')).filter((value) =>
      AGE_GROUP_VALUES.includes(value),
    ),
    gender: GENDER_TARGET_VALUES.includes(searchParams.get('gender'))
      ? searchParams.get('gender')
      : '',
    price_min: parsePrice(searchParams.get('price_min')),
    price_max: parsePrice(searchParams.get('price_max')),
    in_stock: parseBoolean(searchParams.get('in_stock')),
    on_sale: parseBoolean(searchParams.get('on_sale')),
    sort: SORT_OPTION_VALUES.includes(sort) ? sort : 'relevance',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function countActiveFilters(filters) {
  return (
    filters.category_id.length +
    filters.brand_id.length +
    filters.age_group.length +
    (filters.gender ? 1 : 0) +
    (filters.price_min != null || filters.price_max != null ? 1 : 0) +
    (filters.in_stock != null ? 1 : 0) +
    (filters.on_sale != null ? 1 : 0)
  );
}

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const activeFilterCount = countActiveFilters(filters);
  const hasFilters = activeFilterCount > 0;

  const apiQuery = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      category_id: filters.category_id.length ? filters.category_id.join(',') : undefined,
      brand_id: filters.brand_id.length ? filters.brand_id.join(',') : undefined,
      age_group: filters.age_group.length ? filters.age_group.join(',') : undefined,
      gender: filters.gender || undefined,
      price_min: filters.price_min ?? undefined,
      price_max: filters.price_max ?? undefined,
      in_stock: filters.in_stock == null ? undefined : String(filters.in_stock),
      on_sale: filters.on_sale == null ? undefined : String(filters.on_sale),
      sort: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    }),
    [filters],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useSearchProducts(
    { query: apiQuery },
    { placeholderData: (previous) => previous, staleTime: 30_000 },
  );

  const noResults = !isLoading && !isError && (data?.total ?? 0) === 0;
  const { data: popularKeywords = [], isLoading: popularLoading } = useGetPopularKeywords(
    { query: { limit: 8 } },
    { enabled: noResults, staleTime: 5 * 60_000, retry: false },
  );

  function updateUrl(patch, { resetPage = true } = {}) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      const empty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (empty) params.delete(key);
      else if (Array.isArray(value)) params.set(key, value.join(','));
      else params.set(key, String(value));
    }

    if (resetPage) params.delete('page');

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function handleToggleFacet(key, value) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateUrl({ [key]: next });
  }

  function handlePriceChange({ price_min, price_max }) {
    updateUrl({ price_min, price_max });
  }

  function handleGenderChange(value) {
    updateUrl({ gender: value || undefined });
  }

  function handleAvailabilityChange(key, value) {
    updateUrl({ [key]: value == null ? undefined : value });
  }

  function handleSortChange(value) {
    updateUrl({ sort: value === 'relevance' ? undefined : value });
  }

  function handleClearFilters() {
    updateUrl(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])));
  }

  const filterProps = {
    facets: data?.facets,
    filters,
    onToggleFacet: handleToggleFacet,
    onPriceChange: handlePriceChange,
    onGenderChange: handleGenderChange,
    onAvailabilityChange: handleAvailabilityChange,
    onClear: handleClearFilters,
    hasFilters,
  };

  const busy = isLoading || isFetching || isPending;
  const priceKey = `${filters.price_min ?? ''}|${filters.price_max ?? ''}`;

  return (
    <div className="kaido-container py-8 md:py-10">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm kiếm' }]} />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-ink">
            {filters.keyword ? (
              <>
                Kết quả cho <span className="text-primary">“{filters.keyword}”</span>
              </>
            ) : (
              'Tất cả sản phẩm'
            )}
          </h1>
          <p className="mt-1 text-body-s text-slate" aria-live="polite">
            {isLoading
              ? 'Đang tìm sản phẩm…'
              : `${data?.total ?? 0} sản phẩm${
                  activeFilterCount > 0 ? ` · ${activeFilterCount} bộ lọc đang áp dụng` : ''
                }`}
          </p>
        </div>

        <SortDropdown
          value={filters.sort}
          onChange={handleSortChange}
          disabled={isPending}
        />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <details className="rounded-md border border-fog bg-white lg:hidden">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-body-s font-semibold text-ink">
            <span>Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            <span aria-hidden="true" className="text-mist">
              ⌄
            </span>
          </summary>
          <div className="border-t border-fog p-3">
            <FilterPanel key={`mobile-${priceKey}`} {...filterProps} className="border-0 p-0" />
          </div>
        </details>

        <aside className="hidden lg:block">
          <FilterPanel key={`desktop-${priceKey}`} {...filterProps} className="lg:sticky lg:top-24" />
        </aside>

        <section aria-label="Kết quả tìm kiếm" aria-busy={busy || undefined}>
          {isError ? (
            <ProductGrid error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <ProductGrid loading skeletonCount={PAGE_SIZE} />
          ) : noResults ? (
            <NoResult
              keyword={filters.keyword}
              popularKeywords={popularKeywords}
              popularLoading={popularLoading}
              hasFilters={hasFilters}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <>
              <ProductGrid products={data?.results ?? []} fetching={isFetching || isPending} />
              <Pagination
                page={data?.page ?? 1}
                totalPages={data?.total_pages ?? 0}
                totalItems={data?.total ?? 0}
                pageSize={PAGE_SIZE}
                disabled={isPending}
                className="mt-8"
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
