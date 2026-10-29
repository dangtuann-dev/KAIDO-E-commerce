'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — FilterPanel
 * SRS: M03-F03, M03-F04, M03-F05, M03-F06, M03-F09 | API: API-M03-01
 * Route: /search
 * UI: Facet danh mục, thương hiệu, khoảng giá, độ tuổi, giới tính, tình trạng; nút xóa bộ lọc.
 */
import { useId, useState } from 'react';
import {
  AGE_GROUP_LABELS,
  AGE_GROUP_VALUES,
  GENDER_TARGET_LABELS,
  GENDER_TARGET_VALUES,
} from '@/shared/constants/product.js';
import { formatVND } from '@/shared/utils/formatVND.js';
import { cn } from '@/shared/utils/cn.js';
import Button from '@/shared/ui/button.jsx';
import Checkbox from '@/shared/ui/checkbox.jsx';
import Input from '@/shared/ui/input.jsx';
import Radio from '@/shared/ui/radio.jsx';

const EMPTY_FACETS = Object.freeze({
  category: [],
  brand: [],
  price: { min: 0, max: 0 },
  age_group: [],
  gender: [],
  in_stock: [],
  on_sale: [],
});

function facetCount(facets, key, value) {
  return (facets[key] ?? []).find((item) => item.value === value)?.count ?? 0;
}

function FilterSection({ title, children, className }) {
  return (
    <section className={cn('border-t border-fog pt-4 first:border-t-0 first:pt-0', className)}>
      <h3 className="mb-2 font-heading text-h6 text-ink">{title}</h3>
      {children}
    </section>
  );
}

function CheckboxOption({ label, count, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Checkbox
        label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        containerClassName="min-w-0 flex-1"
      />
      <span className="shrink-0 text-caption text-mist" aria-label={`${count} sản phẩm`}>
        {count}
      </span>
    </div>
  );
}

export default function FilterPanel({
  facets = EMPTY_FACETS,
  filters,
  onToggleFacet,
  onPriceChange,
  onGenderChange,
  onAvailabilityChange,
  onClear,
  hasFilters = false,
  className,
}) {
  const genderGroupName = useId();
  const resolved = { ...EMPTY_FACETS, ...facets };
  const [priceMin, setPriceMin] = useState(filters.price_min ?? '');
  const [priceMax, setPriceMax] = useState(filters.price_max ?? '');
  const [priceError, setPriceError] = useState('');

  const categoryOptions = resolved.category ?? [];
  const brandOptions = resolved.brand ?? [];
  const priceBounds = resolved.price ?? { min: 0, max: 0 };

  function handlePriceSubmit(event) {
    event.preventDefault();
    const min = priceMin === '' ? null : Number(priceMin);
    const max = priceMax === '' ? null : Number(priceMax);

    if (Number.isNaN(min) || Number.isNaN(max) || (min != null && min < 0) || (max != null && max < 0)) {
      setPriceError('Giá phải là số không âm.');
      return;
    }
    if (min != null && max != null && min > max) {
      setPriceError('Giá thấp nhất phải nhỏ hơn hoặc bằng giá cao nhất.');
      return;
    }

    setPriceError('');
    onPriceChange({ price_min: min, price_max: max });
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-md border border-fog bg-white p-4',
        className,
      )}
      aria-label="Bộ lọc sản phẩm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-h5 text-ink">Bộ lọc</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-body-s font-semibold text-primary transition-colors duration-250 hover:text-primary-hover"
          >
            Xóa tất cả
          </button>
        ) : null}
      </div>

      <FilterSection title="Danh mục">
        {categoryOptions.length === 0 ? (
          <p className="text-body-s text-slate">Chưa có danh mục phù hợp.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {categoryOptions.map((category) => (
              <li key={category.id}>
                <CheckboxOption
                  label={category.name}
                  count={category.count}
                  checked={filters.category_id.includes(category.id)}
                  onChange={() => onToggleFacet('category_id', category.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </FilterSection>

      <FilterSection title="Thương hiệu">
        {brandOptions.length === 0 ? (
          <p className="text-body-s text-slate">Chưa có thương hiệu phù hợp.</p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {brandOptions.map((brand) => (
              <li key={brand.id}>
                <CheckboxOption
                  label={brand.name}
                  count={brand.count}
                  checked={filters.brand_id.includes(brand.id)}
                  onChange={() => onToggleFacet('brand_id', brand.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </FilterSection>

      <FilterSection title="Khoảng giá">
        <form onSubmit={handlePriceSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Từ"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={priceMin}
              onChange={(event) => setPriceMin(event.target.value)}
              placeholder={priceBounds.min ? String(priceBounds.min) : '0'}
              containerClassName="min-w-0"
            />
            <Input
              label="Đến"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={priceMax}
              onChange={(event) => setPriceMax(event.target.value)}
              placeholder={priceBounds.max ? String(priceBounds.max) : '0'}
              containerClassName="min-w-0"
            />
          </div>
          {priceBounds.max > 0 ? (
            <p className="text-caption text-slate">
              Giá hiện có: {formatVND(priceBounds.min)} – {formatVND(priceBounds.max)}
            </p>
          ) : null}
          {priceError ? <p className="text-body-s text-sale">{priceError}</p> : null}
          <Button type="submit" size="sm" variant="outline" className="self-start">
            Áp dụng giá
          </Button>
        </form>
      </FilterSection>

      <FilterSection title="Độ tuổi">
        <ul className="space-y-1">
          {AGE_GROUP_VALUES.map((value) => (
            <li key={value}>
              <CheckboxOption
                label={AGE_GROUP_LABELS[value]}
                count={facetCount(resolved, 'age_group', value)}
                checked={filters.age_group.includes(value)}
                onChange={() => onToggleFacet('age_group', value)}
              />
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Giới tính">
        <div role="radiogroup" aria-label="Giới tính">
          <Radio
            name={genderGroupName}
            label="Tất cả"
            checked={!filters.gender}
            onChange={() => onGenderChange('')}
          />
          {GENDER_TARGET_VALUES.map((value) => (
            <Radio
              key={value}
              name={genderGroupName}
              label={GENDER_TARGET_LABELS[value]}
              checked={filters.gender === value}
              onChange={() => onGenderChange(value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Tình trạng">
        <Checkbox
          label={`Còn hàng (${facetCount(resolved, 'in_stock', true)})`}
          checked={filters.in_stock === true}
          onChange={() => onAvailabilityChange('in_stock', filters.in_stock === true ? null : true)}
        />
        <Checkbox
          label={`Đang khuyến mãi (${facetCount(resolved, 'on_sale', true)})`}
          checked={filters.on_sale === true}
          onChange={() => onAvailabilityChange('on_sale', filters.on_sale === true ? null : true)}
        />
      </FilterSection>
    </div>
  );
}
