'use client';

import { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn.js';
import Spinner from '@/shared/ui/spinner.jsx';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active',
  accent: 'bg-accent text-ink hover:bg-accent-hover active:bg-accent-active',
  secondary: 'bg-secondary text-white hover:opacity-90 active:opacity-80',
  outline: 'border border-fog bg-white text-ink hover:border-primary hover:text-primary',
  ghost: 'bg-transparent text-ink hover:bg-fog/60',
  danger: 'bg-sale text-white hover:opacity-90 active:opacity-80',
  icon: 'bg-transparent p-0 text-ink hover:bg-fog/60',
};

const SIZES = {
  sm: 'px-3 text-body-s',
  md: 'px-5 text-body-s',
  lg: 'px-7 text-body',
};

/**
 * [SHARED] Button — Blueprint §4.1. Cao tối thiểu 44px (mobile), focus ring 2px.
 * Icon-only dùng variant="icon" kèm aria-label.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel = 'Đang xử lý…',
    disabled = false,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isIcon = variant === 'icon';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm font-body font-semibold transition-colors duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        isIcon ? 'h-11 w-11 shrink-0' : SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" label={loadingLabel} /> : null}
      {loading && isIcon ? null : children}
      {loading && isIcon ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
