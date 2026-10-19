/**
 * [TOY-M02] Sản phẩm và danh mục — AgeBadge
 * SRS: M02-F10, M02-F11
 * Route: ProductCard, /products/[slug]
 * UI: Nhãn độ tuổi từ trường age_group, màu theo nhóm tuổi.
 */
import { cn } from '@/shared/utils/cn.js';

const AGE_GROUPS = {
  '0-12m': { label: '0–12 tháng', tone: 'bg-surface-blush text-secondary' },
  '1-3y': { label: '1–3 tuổi', tone: 'bg-accent/30 text-ink' },
  '3-6y': { label: '3–6 tuổi', tone: 'bg-surface-sky text-primary-active' },
  '6-12y': { label: '6–12 tuổi', tone: 'bg-surface-mint text-success-strong' },
  '12y+': { label: '12+ tuổi', tone: 'bg-secondary/10 text-secondary' },
};

function resolveAgeGroup(value) {
  if (!value) return null;
  const key = String(value).trim();
  return AGE_GROUPS[key] ?? { label: key, tone: 'bg-fog text-ink' };
}

export default function AgeBadge({ ageGroup, className }) {
  const groups = (Array.isArray(ageGroup) ? ageGroup : [ageGroup]).filter(Boolean);
  if (groups.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap gap-1">
      {groups.map((value) => {
        const group = resolveAgeGroup(value);
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
