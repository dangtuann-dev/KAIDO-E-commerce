import { cn } from '@/shared/utils/cn.js';

const RADIUS = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

/**
 * [SHARED] Skeleton — khung chờ dữ liệu (Blueprint §4.3).
 */
export default function Skeleton({ className, rounded = 'md' }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-fog/80', RADIUS[rounded] ?? RADIUS.md, className)}
    />
  );
}
