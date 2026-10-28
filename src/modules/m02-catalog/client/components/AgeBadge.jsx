/**
 * [TOY-M02] Sản phẩm và danh mục — AgeBadge
 * SRS: M02-F05, M02-F10 | API: API-M02-02, API-M02-03
 * Route: ProductCard, /products/[slug], trang danh mục
 * UI: Nhãn độ tuổi từ trường age_group (giá trị DB: 0-12M, 1-3Y, ...).
 */
import { AGE_GROUP_LABELS } from '@/shared/constants/product.js';
import { cn } from '@/shared/utils/cn.js';

const AGE_TONES = {
  '0-12M': 'bg-surface-blush text-secondary',
  '1-3Y': 'bg-accent/30 text-ink',
  '3-6Y': 'bg-surface-sky text-primary-active',
  '6-12Y': 'bg-surface-mint text-success-strong',
  '12Y_PLUS': 'bg-secondary/10 text-secondary',
};

function resolveAgeGroup(value) {
  const key = String(value ?? '').trim();
  if (!key) return null;
  return {
    label: AGE_GROUP_LABELS[key] ?? key,
    tone: AGE_TONES[key] ?? 'bg-fog text-ink',
  };
}

export default function AgeBadge({ ageGroup, className }) {
  const groups = (Array.isArray(ageGroup) ? ageGroup : [ageGroup]).filter(Boolean);
  if (groups.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap gap-1">
      {groups.map((value) => {
        const group = resolveAgeGroup(value);
        if (!group) return null;
        return (
          <span
            key={String(value)}
            aria-label={`Độ tuổi ${group.label}`}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold',
              group.tone,
              className,
            )}
          >
            {group.label}
          </span>
        );
      })}
    </span>
  );
}
