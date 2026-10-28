'use client';

/**
 * [TOY-M02] Sản phẩm và danh mục — CatalogFilters
 * SRS: M02-F10, M03-F08 | API: API-M02-02, API-M02-10
 * Route: /products, /category/[slug]
 * UI: Lọc theo danh mục/thương hiệu/từ khóa, sắp xếp; đồng bộ URL chia sẻ được.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Input from '@/shared/ui/input.jsx';
import Select from '@/shared/ui/select.jsx';
import Button from '@/shared/ui/button.jsx';
import { SORT_OPTION_LABELS } from '@/shared/constants/product.js';

const SORT_OPTIONS = Object.entries(SORT_OPTION_LABELS)
  .filter(([value]) => value !== 'relevance')
  .map(([value, label]) => ({
    value,
    label,
  }));

function flattenCategories(nodes, depth = 0, result = []) {
  for (const node of nodes ?? []) {
    result.push({
      value: node.slug,
      label: `${'— '.repeat(depth)}${node.name}`,
      disabled: node.is_active === false,
    });
    flattenCategories(node.children, depth + 1, result);
  }
  return result;
}

export default function CatalogFilters({
  categories = [],
  brands = [],
  lockedCategorySlug = null,
  className,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const hasFilters = ['keyword', 'brand_slug', 'sort'].some((key) => searchParams.get(key));

  const categoryOptions = flattenCategories(categories);
  const brandOptions = (brands ?? []).map((brand) => ({ value: brand.slug, label: brand.name }));

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ['category_slug', 'brand_slug', 'keyword', 'sort']) {
      const value = formData.get(key);
      if (value) params.set(key, String(value).trim());
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      key={filterKey}
      onSubmit={handleSubmit}
      aria-label="Bộ lọc sản phẩm"
      className={`flex flex-col gap-4 rounded-md border border-fog bg-white p-4 ${className ?? ''}`}
    >
      <h2 className="font-heading text-h6 text-ink">Bộ lọc</h2>

      <Input
        label="Tìm theo tên"
        name="keyword"
        type="search"
        placeholder="Ví dụ: Lego, xe đạp…"
        defaultValue={searchParams.get('keyword') ?? ''}
      />

      {lockedCategorySlug ? null : (
        <Select
          label="Danh mục"
          name="category_slug"
          defaultValue={searchParams.get('category_slug') ?? ''}
          options={[{ value: '', label: 'Tất cả danh mục' }, ...categoryOptions]}
        />
      )}

      <Select
        label="Thương hiệu"
        name="brand_slug"
        defaultValue={searchParams.get('brand_slug') ?? ''}
        options={[{ value: '', label: 'Tất cả thương hiệu' }, ...brandOptions]}
      />

      <Select
        label="Sắp xếp"
        name="sort"
        defaultValue={searchParams.get('sort') ?? ''}
        options={[{ value: '', label: 'Phù hợp nhất' }, ...SORT_OPTIONS]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm">
          Áp dụng
        </Button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-body-s font-semibold text-slate transition-colors duration-250 hover:text-primary"
          >
            Xóa lọc
          </button>
        ) : null}
      </div>
    </form>
  );
}
