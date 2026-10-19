import { cn } from '@/shared/utils/cn.js';

const TONES = {
  neutral: 'bg-fog text-ink',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success-strong',
  warning: 'bg-accent text-ink',
  danger: 'bg-sale/10 text-sale',
  sale: 'bg-sale text-white',
  info: 'bg-surface-sky text-primary-active',
};

/**
 * [SHARED] Badge — nhãn trạng thái (đơn hàng, tồn kho, review...).
 */
export default function Badge({ tone = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}
