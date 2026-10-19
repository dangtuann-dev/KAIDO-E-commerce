import Badge from '@/shared/ui/badge.jsx';
import { cn } from '@/shared/utils/cn.js';

/**
 * [SHARED] ModuleStub — khung nét đứt cho mọi page/component chưa triển khai.
 * Hiển thị mã module, component, route, mã SRS và danh sách TODO để thành viên
 * nhận module biết chính xác điểm bắt đầu (Giai đoạn 6, 7).
 */
export default function ModuleStub({
  moduleCode,
  moduleName,
  componentName,
  route,
  srsRefs = [],
  todos = [],
  description,
  children,
  className,
  headingLevel = 'h1',
}) {
  const headingId = `stub-${componentName}`;
  const Heading = headingLevel;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'rounded-lg border-2 border-dashed border-primary/30 bg-surface-sky/40 p-6 md:p-10',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{moduleCode}</Badge>
        <Badge tone="warning">Khung chờ triển khai</Badge>
        {route ? (
          <code className="rounded-sm bg-white/80 px-2 py-1 text-caption text-slate">{route}</code>
        ) : null}
      </div>

      <Heading id={headingId} className="mt-4 font-heading text-h2 text-ink">
        {componentName}
      </Heading>
      <p className="mt-1 text-body-s font-semibold text-primary-active">{moduleName}</p>
      <p className="mt-3 max-w-3xl text-body text-slate text-pretty">
        {description ||
          'Trang/component này thuộc khung nền tảng. Nghiệp vụ chi tiết sẽ được thành viên phụ trách module triển khai theo SRS và Blueprint.'}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-heading text-h6 text-ink">Mã SRS liên quan</h2>
          {srsRefs.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {srsRefs.map((ref) => (
                <li key={ref}>
                  <code className="rounded-sm border border-fog bg-white px-2 py-1 text-caption text-ink">
                    {ref}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-body-s text-slate">Chưa xác định — xem README của module.</p>
          )}
        </div>

        <div>
          <h2 className="font-heading text-h6 text-ink">Việc cần làm</h2>
          {todos.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {todos.map((todo) => (
                <li key={todo} className="flex gap-2 text-body-s text-slate">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"
                  />
                  <span>{todo}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-body-s text-slate">
              Xem mục &quot;Cách làm tiếp&quot; trong README của module.
            </p>
          )}
        </div>
      </div>

      {children ? <div className="mt-6">{children}</div> : null}

      <p className="mt-6 border-t border-primary/10 pt-4 text-caption text-slate">
        Owner và trạng thái: xem <code className="text-ink">docs/MODULES.md</code>. Tìm việc còn lại
        bằng <code className="text-ink">grep -rn &quot;TODO({moduleCode}&quot; src/modules</code>.
      </p>
    </section>
  );
}
