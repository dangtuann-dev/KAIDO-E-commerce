'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] Input — label + hint + lỗi Zod, thuộc Blueprint §4.1.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    id,
    className,
    containerClassName,
    required = false,
    type = 'text',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-body-s font-semibold text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-sale" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'block w-full rounded-sm border border-fog bg-white px-3.5 py-2.5 text-body text-ink placeholder:text-mist transition-colors duration-250 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-fog/40',
          error && 'border-sale focus:border-sale focus:ring-sale/20',
          className,
        )}
        {...props}
      />
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

Input.displayName = 'Input';

export default Input;
