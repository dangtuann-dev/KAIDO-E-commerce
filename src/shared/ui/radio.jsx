'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] Radio — dùng cho chọn phương thức thanh toán/vận chuyển.
 * Nhóm radio do form cha quản lý name/value.
 */
const Radio = forwardRef(function Radio(
  { label, hint, error, id, className, containerClassName, ...props },
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
        {/* ARIA cho phép aria-invalid trên form control; rule jsx-a11y chưa cập nhật cho role radio. */}
        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
        <input
          ref={ref}
          id={inputId}
          type="radio"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'mt-1 h-4 w-4 border-fog text-primary focus:ring-2 focus:ring-primary/30',
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

Radio.displayName = 'Radio';

export default Radio;
