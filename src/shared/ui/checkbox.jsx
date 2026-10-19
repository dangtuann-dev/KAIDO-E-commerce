'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] Checkbox — có label, hint và lỗi; vùng chạm tối thiểu 44px.
 */
const Checkbox = forwardRef(function Checkbox(
  { label, error, hint, id, className, containerClassName, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <div className="flex min-h-[44px] items-start gap-2.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'mt-1 h-4 w-4 rounded border-fog text-primary focus:ring-2 focus:ring-primary/30',
            error && 'border-sale',
            className,
          )}
          {...props}
        />
        {label ? (
          <label htmlFor={inputId} className="pt-0.5 text-body-s text-ink">
            {label}
          </label>
        ) : null}
      </div>
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
