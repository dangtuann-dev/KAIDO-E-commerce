'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] Select — native select có label/hint/lỗi.
 * Dropdown phụ thuộc (Tỉnh → Huyện → Xã, Blueprint §3.4): form cha giữ state,
 * reset và disable select con khi giá trị cha thay đổi; component này chỉ render.
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    id,
    options = [],
    placeholder,
    className,
    containerClassName,
    required = false,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="text-body-s font-semibold text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-sale" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block w-full appearance-none rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
          error && 'border-sale focus:border-sale focus:ring-sale/20',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-body-s text-sale">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-body-s text-slate">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
