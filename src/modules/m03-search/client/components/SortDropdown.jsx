'use client';

/**
 * [TOY-M03] Tìm kiếm, lọc, sắp xếp — SortDropdown
 * SRS: M03-F07 | API: API-M03-01
 * Route: /search
 * UI: Sắp xếp mặc định, giá tăng/giảm, mới nhất, bán chạy, tên A–Z.
 */
import { useId } from 'react';
import { SORT_OPTION_LABELS, SORT_OPTION_VALUES } from '@/shared/constants/product.js';
import { cn } from '@/shared/utils/cn.js';

export default function SortDropdown({ value = 'relevance', onChange, disabled = false, className }) {
  const selectId = useId();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={selectId} className="shrink-0 text-body-s text-slate">
        Sắp xếp
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 min-w-[170px] rounded-sm border border-fog bg-white px-3 text-body-s font-semibold text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {SORT_OPTION_VALUES.map((option) => (
          <option key={option} value={option}>
            {SORT_OPTION_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
