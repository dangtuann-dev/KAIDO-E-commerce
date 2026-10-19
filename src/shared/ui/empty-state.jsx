import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] EmptyState — trạng thái rỗng cho giỏ hàng, danh sách, tìm kiếm.
 */
export default function EmptyState({ title, description, action, icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-fog bg-white px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-primary">{icon}</div>
      ) : (
        <div
          aria-hidden="true"
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sky"
        >
          <span className="h-5 w-5 rounded-full border-2 border-primary/50" />
        </div>
      )}
      <h2 className="font-heading text-h5 text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-body-s text-slate">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
